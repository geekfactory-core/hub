use crate::components::Environment;
use crate::handlers::deployments::processor::ProcessingTaskResult;
use crate::handlers::deployments::states::{
    delay_processing, get_deployment_data, to_processing_error, update_deployment,
};
use crate::handlers::wallet::get_deployment_transit_canister_sub_account;
use crate::log_info;
use crate::model::deployments::DeploymentLock;
use common_canister_impl::components::icrc2_ledger::{to_icrc1_account, Account, TransferFromArgs};
use common_canister_types::TokenE8s;
use hub_canister_api::types::{DeploymentId, DeploymentProcessingEvent};
use ic_ledger_types::BlockIndex;
use icrc_ledger_types::icrc1::account::principal_to_subaccount;
use icrc_ledger_types::icrc1::transfer::Memo;
use num_traits::ToPrimitive;
use serde_bytes::ByteBuf;

/// Transfer funds from deployer approved account to transit sub_account
pub(crate) async fn process(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
) -> Result<ProcessingTaskResult, String> {
    let ledger = env.get_ledger();
    let ledger_fee = ledger.get_ledger_fee().await?;

    let (deployer, approved_account, expenses_amount) =
        get_deployment_data(deployment_id, |_, deployment| {
            (
                deployment.deployer,
                deployment.approved_account.clone(),
                deployment.expenses_amount,
            )
        });

    let transit_sub_account = get_deployment_transit_canister_sub_account(deployment_id);
    let transit_balance = ledger
        .get_canister_subaccount_balance(&transit_sub_account)
        .await?;

    log_info!(env, "Deployment {deployment_id}: transit balance: {transit_balance}, expenses amount: {expenses_amount}, ledger fee: {ledger_fee}.");

    let transfer_amount = expenses_amount - ledger_fee;
    if transit_balance >= transfer_amount {
        transit_success(env, deployment_id, lock, transit_balance, 0, None)?;
        return Ok(delay_processing());
    }

    let transfer_amount = transfer_amount - transit_balance;
    let transit_account = ledger.get_canister_account(&transit_sub_account);

    log_info!(
        env,
        "Deployment '{deployment_id}': transfer {transfer_amount} funds from approved account to transit account: {:?} ...",
        transit_account.to_hex()
    );

    match env
        .get_icrc2_ledger()
        .icrc2_transfer_from(TransferFromArgs {
            spender_subaccount: Some(principal_to_subaccount(deployer)),
            from: to_icrc1_account(&approved_account).unwrap(),
            to: Account {
                owner: env.get_ic().get_canister(),
                subaccount: Some(transit_sub_account.0),
            },
            amount: transfer_amount.into(),
            fee: Some(ledger_fee.into()),
            memo: Some(Memo(ByteBuf::from(deployment_id.to_be_bytes().to_vec()))),
            created_at_time: None,
        })
        .await
        .map_err(to_processing_error)?
    {
        Ok(block_index) => {
            transit_success(
                env,
                deployment_id,
                lock,
                transit_balance,
                transfer_amount,
                block_index.0.to_u64(),
            )?;
            Ok(delay_processing())
        }
        Err(reason) => Err(to_processing_error(reason)),
    }
}

fn transit_success(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
    transit_balance: TokenE8s,
    transfer_amount: TokenE8s,
    block_index: Option<BlockIndex>,
) -> Result<(), String> {
    log_info!(
        env,
        "Deployment '{deployment_id}': received deployer funds on transit account at block index: {block_index:?}."
    );

    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::DeployerFundsOnTransitAccountTransferred {
            transit_balance,
            transfer_amount,
            block_index,
        },
    )
}
