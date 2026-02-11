use hub_canister_api::types::{DeploymentId, DeploymentProcessingEvent};

use crate::components::Environment;
use crate::handlers::deployments::processor::ProcessingTaskResult;
use crate::handlers::deployments::states::update_deployment;
use crate::log_info;
use crate::model::deployments::DeploymentLock;

pub(crate) async fn process(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
) -> Result<ProcessingTaskResult, String> {
    log_info!(env, "Deployment '{deployment_id}': finalization started.");

    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::StartCompleteDeployment,
    )?;

    Ok(ProcessingTaskResult::Continue)
}
