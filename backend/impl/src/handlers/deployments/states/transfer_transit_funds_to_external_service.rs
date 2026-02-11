use crate::components::Environment;
use crate::handlers::deployments::processor::ProcessingTaskResult;
use crate::handlers::deployments::states::{delay_processing, get_config, to_processing_error};
use crate::handlers::wallet::get_deployment_transit_canister_sub_account;
use crate::model::deployments::DeploymentLock;
use crate::{log_info, mutate_state};
use common_canister_types::TokenE8s;
use hub_canister_api::types::{DeploymentId, DeploymentProcessingEvent};
use ic_ledger_types::{AccountIdentifier, BlockIndex, Memo};

use super::update_deployment;

/// Move funds from transit sub_account to emergency account
pub(crate) async fn process(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
) -> Result<ProcessingTaskResult, String> {
    let ledger = env.get_ledger();

    let transit_sub_account = get_deployment_transit_canister_sub_account(deployment_id);

    // check funds on transit account

    let transit_amount = ledger
        .get_canister_subaccount_balance(&transit_sub_account)
        .await?;

    let ledger_fee = ledger.get_ledger_fee().await?;

    if transit_amount <= ledger_fee {
        log_info!(
            env,
            "Deployment {deployment_id}: insufficient funds on transit account (balance: {transit_amount})."
        );
        transit_success(deployment_id, lock, 0, None)?;
        return Ok(delay_processing());
    }

    let transfer_amount = transit_amount - ledger_fee;

    let receiver_account_hex =
        get_config(|_, config| config.deployment_fallback_account_hex.clone());

    // transfer

    log_info!(
        env,
        "Deployment '{deployment_id}': transfer {transit_amount} transit funds to account: {receiver_account_hex:?} ..."
    );

    let receiver_account = AccountIdentifier::from_hex(&receiver_account_hex)?;

    let block_index = ledger
        .transfer_from_canister(
            Memo(*deployment_id),
            transit_sub_account,
            receiver_account,
            transfer_amount,
            ledger_fee,
            None,
        )
        .await?
        .map_err(to_processing_error)?;

    log_info!(
        env,
        "Deployment '{deployment_id}': transit funds transferred at block index: {block_index:?}."
    );

    transit_success(deployment_id, lock, transfer_amount, Some(block_index))?;

    Ok(delay_processing())
}

fn transit_success(
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
    transfer_amount: TokenE8s,
    block_index: Option<BlockIndex>,
) -> Result<(), String> {
    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::TransitFundsToExternalServiceTransferred {
            block_index,
            transfer_amount,
        },
    )?;

    mutate_state(|state| {
        let model = state.get_model_mut();
        let contract_template_id = model
            .get_deployments_storage_mut()
            .get_deployment(deployment_id)
            .unwrap()
            .contract_template_id;

        model
            .get_contract_templates_storage_mut()
            .contract_deployed(&contract_template_id);
    });

    Ok(())
}
