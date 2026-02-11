use crate::components::Environment;
use crate::handlers::deployments::build_deployment_information_with_load;
use crate::handlers::deployments::processor::update_deployment_with_lock;
use crate::model::deployments::UpdateDeploymentError;
use crate::{get_env, log_info, read_state};
use hub_canister_api::cancel_deployment::*;
use hub_canister_api::types::{DeploymentId, DeploymentProcessingEvent};
use ic_cdk_macros::update;

#[update]
async fn cancel_deployment(
    Args {
        deployment_id,
        reason,
    }: Args,
) -> Response {
    cancel_deployment_int(deployment_id, reason).await.into()
}

pub(crate) async fn cancel_deployment_int(
    deployment_id: DeploymentId,
    reason: String,
) -> Result<CancelDeploymentResult, CancelDeploymentError> {
    let env = get_env();

    validate_permission(env.as_ref(), &deployment_id)?;

    update_deployment_with_lock(
        &env,
        &deployment_id,
        DeploymentProcessingEvent::DeploymentCanceled { reason },
    )
    .map_err(|error| match error {
        UpdateDeploymentError::WrongState => CancelDeploymentError::DeploymentWrongState,
        UpdateDeploymentError::StorageIsLocked { expiration } => {
            CancelDeploymentError::DeploymentLocked {
                lock: env.get_time().get_delayed_time_millis(expiration),
            }
        }
    })?;

    log_info!(env, "Deployment '{deployment_id}': canceled.");

    crate::handlers::deployments::processor::process_deployment(env.as_ref(), &deployment_id).await;

    Ok(CancelDeploymentResult {
        deployment: build_deployment_information_with_load(&deployment_id).unwrap(),
    })
}

pub fn validate_permission(
    env: &Environment,
    deployment_id: &DeploymentId,
) -> Result<(), CancelDeploymentError> {
    read_state(|state| {
        let deployment = state
            .get_model()
            .get_deployments_storage()
            .get_deployment(deployment_id)
            .ok_or(CancelDeploymentError::DeploymentNotFound)?;

        if deployment.deployer != env.get_ic().get_caller() {
            return Err(CancelDeploymentError::PermissionDenied);
        }

        Ok(())
    })
}
