use crate::components::Environment;
use crate::handlers::deployments::build_deployment_information_with_load;
use crate::handlers::deployments::processor::{process_deployment, update_deployment_with_lock};
use crate::model::deployments::UpdateDeploymentError;
use crate::{get_env, log_info, read_state};
use hub_canister_api::retry_generate_contract_certificate::*;
use hub_canister_api::types::{DeploymentId, DeploymentProcessingEvent};
use ic_cdk_macros::update;

#[update]
async fn retry_generate_contract_certificate(args: Args) -> Response {
    retry_generate_contract_certificate_int(args).await.into()
}

async fn retry_generate_contract_certificate_int(
    Args { deployment_id }: Args,
) -> Result<RetryGenerateContractCertificateResult, RetryGenerateContractCertificateError> {
    let env = get_env();

    validate_permission(env.as_ref(), &deployment_id)?;

    update_deployment_with_lock(
        &env,
        &deployment_id,
        DeploymentProcessingEvent::RetryGenerateContractCertificate,
    )
    .map_err(|error| match error {
        UpdateDeploymentError::WrongState => {
            RetryGenerateContractCertificateError::DeploymentWrongState
        }
        UpdateDeploymentError::StorageIsLocked { expiration } => {
            RetryGenerateContractCertificateError::DeploymentLocked {
                lock: env.get_time().get_delayed_time_millis(expiration),
            }
        }
    })?;

    log_info!(
        env,
        "Deployment '{deployment_id}': regenerating certificate..."
    );

    process_deployment(&env, &deployment_id).await;

    Ok(RetryGenerateContractCertificateResult {
        deployment: build_deployment_information_with_load(&deployment_id).unwrap(),
    })
}

fn validate_permission(
    env: &Environment,
    deployment_id: &DeploymentId,
) -> Result<(), RetryGenerateContractCertificateError> {
    read_state(|state| {
        let deployment = state
            .get_model()
            .get_deployments_storage()
            .get_deployment(deployment_id)
            .ok_or(RetryGenerateContractCertificateError::DeploymentNotFound)?;

        if deployment.deployer != env.get_ic().get_caller() {
            return Err(RetryGenerateContractCertificateError::PermissionDenied);
        }

        Ok(())
    })
}
