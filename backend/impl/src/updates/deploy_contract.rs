use std::cmp::min;

use crate::components::Environment;
use crate::handlers::deployments::expenses_calculator::DeploymentExpensesCalculator;
use crate::handlers::deployments::processor::process_deployment;
use crate::handlers::deployments::{
    build_deployment_information, build_deployment_information_with_load, find_active_deployment,
};
use crate::{get_env, log_info, mutate_state, read_state};
use candid::Principal;
use common_canister_impl::components::cmc::interface::CallWrapperError;
use common_canister_impl::components::icrc2_ledger::to_icrc1_account;
use common_canister_impl::components::ledger::to_account_identifier;
use common_canister_types::{millis_to_nanos, LedgerAccount, TimestampMillis, TokenE8s};
use common_contract_api::ContractTemplateId;
use hub_canister_api::deploy_contract::*;
use hub_canister_api::types::{
    DeploymentExpenses, IcpConversationRate, IcpXdrConversionRateStrategy,
};
use ic_cdk_macros::update;
use icrc_ledger_types::icrc1::account::{principal_to_subaccount, Account};
use icrc_ledger_types::icrc2::allowance::AllowanceArgs;

use num_traits::ToPrimitive;

#[update]
async fn deploy_contract(
    Args {
        approved_account,
        contract_template_id,
        subnet_type,
    }: Args,
) -> Response {
    deploy_contract_int(approved_account, contract_template_id, subnet_type)
        .await
        .into()
}

pub(crate) async fn deploy_contract_int(
    approved_account: LedgerAccount,
    contract_template_id: ContractTemplateId,
    subnet_type: Option<String>,
) -> Result<DeployContractResult, DeployContractError> {
    let env = get_env();
    if env.get_ic().is_caller_anonymous() {
        return Err(DeployContractError::CallerNotAuthorized);
    }

    let deployer = env.get_ic().get_caller();

    // validate deployment

    let (
        deployment_cycles_cost,
        amount_buffer_permyriad,
        amount_decimal_places,
        allowance_expiration_timeout,
        icp_xdr_conversion_rate_strategy,
        contract_activation_required,
        contract_initial_cycles,
    ) = read_state(|state| {
        let config = &state.get_model().get_config_storage().get_config();

        if !config.is_deployment_available {
            return Err(DeployContractError::DeploymentUnavailable);
        }

        let contract = state
            .get_model()
            .get_contract_templates_storage()
            .get_contract_template(&contract_template_id)
            .ok_or(DeployContractError::ContractTemplateNotFound)?;

        if contract.blocked.is_some() {
            return Err(DeployContractError::ContractTemplateBlocked);
        }

        Ok((
            config.deployment_cycles_cost,
            config.deployment_expenses_amount_buffer_permyriad,
            config.deployment_expenses_amount_decimal_places,
            config.deployment_allowance_expiration_timeout,
            config.icp_xdr_conversion_rate_strategy.clone(),
            contract.definition.activation_required,
            contract
                .definition
                .contract_canister_settings
                .initial_cycles,
        ))
    })?;

    // check active deployment

    if let Some(deployment) = find_active_deployment(&deployer, build_deployment_information) {
        return Err(DeployContractError::ActiveDeploymentExists {
            deployment: Box::new(deployment),
        });
    }

    // get icp conversion rate

    let icp_conversation_rate =
        get_icp_conversation_rate(env.as_ref(), icp_xdr_conversion_rate_strategy).await?;

    // get deployment expenses calculator

    let deployment_expenses = DeploymentExpenses {
        deployment_cycles_cost,
        contract_initial_cycles,
        amount_buffer_permyriad,
        amount_decimal_places,
        icp_conversation_rate,
    };

    let deployment_expenses_calculator =
        DeploymentExpensesCalculator::new(deployment_expenses.clone());

    // calculate expenses amount and check approved account

    let expenses_amount = calculate_expenses_amount(
        deployer,
        &deployment_expenses_calculator,
        &approved_account,
        allowance_expiration_timeout,
    )
    .await?;

    // generate activation code

    let activation_code = if contract_activation_required {
        Some(
            env.get_rand()
                .generate_16()
                .await
                .map(hex::encode)
                .map_err(|reason| DeployContractError::GenerateActivationCodeError { reason })?,
        )
    } else {
        None
    };

    // create new deployment

    let deployment_id = mutate_state(|state| {
        let time = env.get_time().get_current_unix_epoch_time_millis();
        Ok(state
            .get_model_mut()
            .get_deployments_storage_mut()
            .create_new_deployment(
                deployer,
                time,
                contract_template_id,
                deployment_expenses.clone(),
                expenses_amount,
                approved_account,
                subnet_type,
                activation_code,
            ))
    })?;

    log_info!(
        env,
        "Deployment '{deployment_id}': created. Expenses: {deployment_expenses:?}, expenses amount: {expenses_amount:?}, deployer: {}.",
        deployer.to_text()
    );

    process_deployment(env.as_ref(), &deployment_id).await;

    Ok(DeployContractResult {
        deployment: build_deployment_information_with_load(&deployment_id).unwrap(),
    })
}

async fn get_icp_conversation_rate(
    env: &Environment,
    strategy: IcpXdrConversionRateStrategy,
) -> Result<IcpConversationRate, DeployContractError> {
    match strategy {
        IcpXdrConversionRateStrategy::Fixed {
            xdr_permyriad_per_icp,
        } => Ok(IcpConversationRate::Fixed {
            xdr_permyriad_per_icp,
        }),
        IcpXdrConversionRateStrategy::CMC { cmc_canister } => env
            .get_cmc()
            .get_icp_xdr_conversion_rate(cmc_canister)
            .await
            .map(|rate| IcpConversationRate::CMC {
                xdr_permyriad_per_icp: rate.xdr_permyriad_per_icp,
                timestamp_seconds: rate.timestamp_seconds,
            })
            .map_err(|reason| match reason {
                CallWrapperError::CallError { reason } => {
                    DeployContractError::GetIcpXdrConversionRateError { reason }
                }
                CallWrapperError::WrappedError { .. } => panic!(),
            }),
    }
}

async fn calculate_expenses_amount(
    deployer: Principal,
    deployment_expenses_calculator: &DeploymentExpensesCalculator,
    approved_account: &LedgerAccount,
    allowance_expiration_timeout: TimestampMillis,
) -> Result<TokenE8s, DeployContractError> {
    let env = get_env();

    let approved_account_identifier = to_account_identifier(approved_account)
        .map_err(|reason| DeployContractError::InvalidApprovedAccount { reason })?;

    let approved_account_icrc1 = to_icrc1_account(approved_account)
        .map_err(|reason| DeployContractError::InvalidApprovedAccount { reason })?;

    let expenses_amount = deployment_expenses_calculator
        .get_deployment_expenses_amount()
        .map_err(|reason| DeployContractError::CalculateDeploymentExpensesError { reason })?;

    let buffered_expenses_amount = deployment_expenses_calculator
        .get_reserved_deployment_expenses_amount(expenses_amount)
        .map_err(|reason| DeployContractError::CalculateDeploymentExpensesError { reason })?;

    let balance = env
        .get_ledger()
        .get_account_balance(approved_account_identifier)
        .await
        .map_err(|reason| DeployContractError::LedgerUnavailable { reason })?;

    if balance < expenses_amount {
        return Err(DeployContractError::InsufficientApprovedAccountBalance);
    }

    let approved_allowance = env
        .get_icrc2_ledger()
        .icrc2_allowance(AllowanceArgs {
            account: approved_account_icrc1,
            spender: Account {
                owner: env.get_ic().get_canister(),
                subaccount: Some(principal_to_subaccount(deployer)),
            },
        })
        .await
        .map_err(|error| DeployContractError::LedgerUnavailable {
            reason: format!("Failed to fetch allowance: {}", error),
        })?;

    let allowance_amount = approved_allowance.allowance.0.to_u64().unwrap_or(0);
    if allowance_amount < expenses_amount {
        return Err(DeployContractError::InsufficientApprovedAccountAllowance);
    }

    if let Some(expires_at) = approved_allowance.expires_at {
        let now = env.get_time().get_current_unix_epoch_time_millis();
        if (expires_at as u128) < millis_to_nanos(&(now + allowance_expiration_timeout)) {
            return Err(DeployContractError::AllowanceExpiresTooEarly);
        }
    }

    Ok(min(
        min(balance, allowance_amount),
        buffered_expenses_amount,
    ))
}
