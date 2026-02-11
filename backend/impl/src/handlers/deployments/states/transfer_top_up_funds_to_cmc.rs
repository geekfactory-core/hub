use crate::components::Environment;
use crate::handlers::deployments::processor::ProcessingTaskResult;
use crate::handlers::deployments::states::{
    delay_processing, to_processing_error, update_deployment,
};
use crate::handlers::wallet::get_deployment_transit_canister_sub_account;
use crate::log_info;
use crate::model::deployments::DeploymentLock;
use hub_canister_api::types::{CyclesConvertingStrategy, DeploymentId, DeploymentProcessingEvent};
use ic_ledger_types::AccountIdentifier;

use super::get_config;

/// Move funds from transit sub_account to CMC for top up hub cycles
pub(crate) async fn process(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
) -> Result<ProcessingTaskResult, String> {
    let ledger = env.get_ledger();
    let cmc = env.get_cmc();

    let strategy = get_config(|_, config| config.cycles_converting_strategy.clone());

    let cmc_canister = match strategy {
        CyclesConvertingStrategy::CMCTopUp {
            cmc_canister: cmc_canister_id,
        } => cmc_canister_id,
        CyclesConvertingStrategy::Skip => {
            return use_external_service_converting(
                env,
                deployment_id,
                lock,
                "skip strategy".to_owned(),
            );
        }
    };

    let transit_sub_account = get_deployment_transit_canister_sub_account(deployment_id);

    // check funds on transit account

    let transit_amount = ledger
        .get_canister_subaccount_balance(&transit_sub_account)
        .await?;

    let ledger_fee = ledger.get_ledger_fee().await?;

    if transit_amount <= ledger_fee {
        return use_external_service_converting(
            env,
            deployment_id,
            lock,
            format!("insufficient funds on transit account (balance: {transit_amount})"),
        );
    }

    let transfer_amount = transit_amount - ledger_fee;

    let receiver_account = AccountIdentifier::new(
        &cmc_canister,
        &cmc.get_canister_sub_account(env.get_ic().get_canister()),
    );

    // transfer

    log_info!(
        env,
        "Deployment {deployment_id}: transferring {transit_amount} transit funds to account {:?} ...",
        receiver_account.to_hex()
    );

    let block_index = ledger
        .transfer_from_canister(
            cmc.get_top_up_canister_memo(),
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
        "Deployment '{deployment_id}': transit funds transferred at block index {block_index}."
    );

    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::TopUpFundsToCMCTransferred {
            cmc_canister,
            block_index,
            transfer_amount,
        },
    )?;

    Ok(delay_processing())
}

fn use_external_service_converting(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
    reason: String,
) -> Result<ProcessingTaskResult, String> {
    log_info!(
        env,
        "Deployment '{deployment_id}': switching to external conversion service: {reason}."
    );
    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::UseExternalServiceConverting { reason },
    )?;
    Ok(ProcessingTaskResult::Continue)
}
