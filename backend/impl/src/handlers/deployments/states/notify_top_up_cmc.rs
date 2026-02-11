use crate::components::Environment;
use crate::handlers::deployments::processor::ProcessingTaskResult;
use crate::handlers::deployments::states::{
    delay_processing, get_config, get_deployment_data, update_deployment,
};
use crate::log_info;
use crate::model::deployments::DeploymentLock;
use common_canister_impl::components::cmc::api::NotifyError;
use common_canister_impl::components::cmc::interface::CallWrapperError;
use hub_canister_api::types::{
    CyclesConvertingStrategy, DeploymentId, DeploymentProcessingEvent, DeploymentState,
};

pub(crate) async fn process(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
) -> Result<ProcessingTaskResult, String> {
    // check change strategy

    let strategy = get_config(|_, config| config.cycles_converting_strategy.clone());
    if let CyclesConvertingStrategy::Skip = strategy {
        return use_external_service_converting(
            env,
            deployment_id,
            lock,
            "strategy switched to skip".to_owned(),
        );
    }

    let (cmc_canister, block_index) = get_deployment_data(deployment_id, |_, deployment| {
        match &deployment.state.value {
            DeploymentState::NotifyCMCTopUp {
                cmc_canister,
                block_index,
            } => (*cmc_canister, *block_index),
            _ => panic!(),
        }
    });

    // notify top up

    let cmc = env.get_cmc();

    log_info!(
        env,
        "Deployment '{deployment_id}': notify CMC {:?} canister about cycles top-up, block_index: {:?} ...",
        cmc_canister.to_text(),
        block_index
    );

    let cycles = match cmc
        .notify_top_up(cmc_canister, block_index, env.get_ic().get_canister())
        .await
    {
        Ok(cycles) => cycles,
        Err(error) => {
            return handle_top_up_error(env, deployment_id, lock, error);
        }
    };

    log_info!(
        env,
        "Deployment '{deployment_id}': top-up successfull, cycles added: {cycles}."
    );

    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::TopUpCMCNotified { cycles },
    )?;

    Ok(delay_processing())
}

fn handle_top_up_error(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
    error: CallWrapperError<NotifyError>,
) -> Result<ProcessingTaskResult, String> {
    match error {
        CallWrapperError::CallError { reason } => Err(reason),
        CallWrapperError::WrappedError { error } => match error {
            NotifyError::Processing => Err("top-up processing...".to_owned()),
            NotifyError::Refunded {
                block_index,
                reason,
            } => use_external_service_converting(
                env,
                deployment_id,
                lock,
                format!("refunded at block index {block_index:?}, reason: {reason}"),
            ),
            NotifyError::InvalidTransaction(reason) => use_external_service_converting(
                env,
                deployment_id,
                lock,
                format!("invalid transaction: {reason}"),
            ),
            NotifyError::TransactionTooOld(block_index) => use_external_service_converting(
                env,
                deployment_id,
                lock,
                format!("transaction too old (block index {block_index})"),
            ),
            NotifyError::Other {
                error_message,
                error_code,
            } => use_external_service_converting(
                env,
                deployment_id,
                lock,
                format!("other error: {error_message}/{error_code}"),
            ),
        },
    }
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
