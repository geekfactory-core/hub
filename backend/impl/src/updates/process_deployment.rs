use crate::handlers::deployments::build_deployment_information_with_load;
use crate::{get_env, log_info, read_state};
use hub_canister_api::process_deployment::*;
use hub_canister_api::types::DeploymentId;
use ic_cdk_macros::update;

#[update]
async fn process_deployment(Args { deployment_id }: Args) -> Response {
    process_deployment_int(deployment_id).await.into()
}

pub(crate) async fn process_deployment_int(
    deployment_id: DeploymentId,
) -> Result<ProcessDeploymentResult, ProcessDeploymentError> {
    let env = get_env();

    // validate

    read_state(|state| {
        let deployment = state
            .get_model()
            .get_deployments_storage()
            .get_deployment(&deployment_id)
            .ok_or(ProcessDeploymentError::DeploymentNotFound)?;

        if deployment.deployer != env.get_ic().get_caller() {
            return Err(ProcessDeploymentError::PermissionDenied);
        }

        Ok(())
    })?;

    log_info!(env, "Deployment '{deployment_id}': processing ...");

    crate::handlers::deployments::processor::process_deployment(env.as_ref(), &deployment_id).await;

    Ok(ProcessDeploymentResult {
        deployment: build_deployment_information_with_load(&deployment_id).unwrap(),
    })
}
