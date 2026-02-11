use hub_canister_api::types::{DeploymentId, DeploymentProcessingEvent};

use crate::components::Environment;
use crate::handlers::deployments::processor::ProcessingTaskResult;
use crate::handlers::deployments::states::{delay_processing, update_deployment};
use crate::log_info;
use crate::model::deployments::DeploymentLock;

pub(crate) async fn process(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
) -> Result<ProcessingTaskResult, String> {
    log_info!(env, "Deployment '{deployment_id}': processing started.");

    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::DeploymentStarted,
    )?;

    Ok(delay_processing())
}
