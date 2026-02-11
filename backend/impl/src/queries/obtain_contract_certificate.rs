use crate::handlers::deployments::states::generate_contract_certificate::build_contract_certificate;
use crate::read_state;
use hub_canister_api::obtain_contract_certificate::*;
use hub_canister_api::types::{DeploymentId, DeploymentState};
use ic_cdk_macros::query;

#[query]
fn obtain_contract_certificate(Args { deployment_id }: Args) -> Response {
    obtain_contract_certificate_int(deployment_id).into()
}

pub(crate) fn obtain_contract_certificate_int(
    deployment_id: DeploymentId,
) -> Result<ObtainContractCertificateResult, ObtainContractCertificateError> {
    read_state(|state| {
        let deployment = state
            .get_model()
            .get_deployments_storage()
            .get_deployment(&deployment_id)
            .ok_or(ObtainContractCertificateError::DeploymentNotFound)?;

        if deployment.deployer != state.get_env().get_ic().get_caller() {
            return Err(ObtainContractCertificateError::PermissionDenied);
        }

        if DeploymentState::WaitingReceiveContractCertificate != deployment.state.value {
            return Err(ObtainContractCertificateError::DeploymentWrongState);
        }

        let certificate = build_contract_certificate(state, deployment);

        let certification = state.get_env().get_certification();
        let signed_certificate = certification
            .get_signed_contract_certificate(
                state.get_model().get_deployments_signature_map(),
                &certificate,
            )
            .map_err(|_| ObtainContractCertificateError::CertificateNotFound)?;

        certification
            .verify_signed_contract_certificate(
                &signed_certificate,
                state.get_env().get_ic().get_root_public_key_raw(),
            )
            .map_err(|reason| ObtainContractCertificateError::BuildCertificateError { reason })?;

        Ok(ObtainContractCertificateResult {
            certificate: signed_certificate,
        })
    })
}
