use crate::handlers::deployments::build_deployment_information_with_load;
use crate::handlers::deployments::processor::{process_deployment, update_deployment_with_lock};
use crate::handlers::deployments::states::generate_contract_certificate::build_contract_certificate;
use crate::model::deployments::UpdateDeploymentError;
use crate::{get_env, log_info, read_state};
use common_contract_api::SignedContractCertificate;
use hub_canister_api::initialize_contract_certificate::*;
use hub_canister_api::types::{DeploymentId, DeploymentProcessingEvent, DeploymentState};
use ic_cdk_macros::update;

#[update]
async fn initialize_contract_certificate(
    Args {
        deployment_id,
        certificate,
    }: Args,
) -> Response {
    initialize_contract_certificate_int(deployment_id, certificate)
        .await
        .into()
}

pub(crate) async fn initialize_contract_certificate_int(
    deployment_id: DeploymentId,
    certificate: SignedContractCertificate,
) -> Result<InitializeContractCertificateResult, InitializeContractCertificateError> {
    let env = get_env();

    // validate

    read_state(|state| {
        let deployment = state
            .get_model()
            .get_deployments_storage()
            .get_deployment(&deployment_id)
            .ok_or(InitializeContractCertificateError::DeploymentNotFound)?;

        if deployment.deployer != env.get_ic().get_caller() {
            return Err(InitializeContractCertificateError::PermissionDenied);
        }

        if DeploymentState::WaitingReceiveContractCertificate != deployment.state.value {
            return Err(InitializeContractCertificateError::DeploymentWrongState);
        }

        let contract_certificate = build_contract_certificate(state, deployment);

        if contract_certificate != certificate.contract_certificate {
            return Err(InitializeContractCertificateError::InvalidCertificate {
                reason: "wrong contract certificate".to_owned(),
            });
        }

        state
            .get_env()
            .get_certification()
            .verify_signed_contract_certificate(
                &certificate,
                env.get_ic().get_root_public_key_raw(),
            )
            .map_err(|reason| InitializeContractCertificateError::InvalidCertificate { reason })?;

        Ok(())
    })?;

    // update deployment

    update_deployment_with_lock(
        &env,
        &deployment_id,
        DeploymentProcessingEvent::ContractCertificateReceived { certificate },
    )
    .map_err(|error| match error {
        UpdateDeploymentError::WrongState => {
            InitializeContractCertificateError::DeploymentWrongState
        }
        UpdateDeploymentError::StorageIsLocked { expiration } => {
            InitializeContractCertificateError::DeploymentLocked {
                lock: env.get_time().get_delayed_time_millis(expiration),
            }
        }
    })?;

    log_info!(
        env,
        "Deployment '{deployment_id}': signed certificate initialized."
    );

    process_deployment(&env, &deployment_id).await;

    Ok(InitializeContractCertificateResult {
        deployment: build_deployment_information_with_load(&deployment_id).unwrap(),
    })
}
