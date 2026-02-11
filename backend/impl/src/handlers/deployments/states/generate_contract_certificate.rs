use crate::components::Environment;
use crate::handlers::deployments::processor::ProcessingTaskResult;
use crate::handlers::deployments::states::{get_deployment_data, update_deployment};
use crate::model::deployments::{Deployment, DeploymentLock};
use crate::state::CanisterState;
use crate::{log_info, mutate_state};
use common_canister_impl::stable_structures::CBor;
use common_contract_api::{ContractCertificate, ContractTemplateId};
use hub_canister_api::types::{DeploymentId, DeploymentProcessingEvent};

pub(crate) async fn process(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
) -> Result<ProcessingTaskResult, String> {
    let certificate = get_deployment_data(deployment_id, |state, deployment| {
        build_contract_certificate(state, deployment)
    });

    let labeled_certificates_hash = mutate_state(|state| {
        state
            .get_env()
            .get_certification()
            .add_contract_signature_to_signature_map(
                state.get_model_mut().get_deployments_signature_map_mut(),
                &certificate,
            )
    });

    env.get_ic()
        .set_certified_data(&labeled_certificates_hash[..]);

    log_info!(
        env,
        "Deployment '{deployment_id}': labeled certificate hash set."
    );

    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::ContractCertificateGenerated,
    )?;

    Ok(ProcessingTaskResult::Stop)
}

pub(crate) fn build_contract_certificate(
    state: &CanisterState,
    deployment: CBor<Deployment>,
) -> ContractCertificate {
    let certificate_duration = state
        .get_model()
        .get_contract_templates_storage()
        .get_contract_template(&deployment.contract_template_id)
        .unwrap()
        .definition
        .certificate_duration;

    ContractCertificate {
        hub_canister: state.get_env().get_ic().get_canister(),
        deployer: deployment.deployer,
        contract_canister: deployment.contract_canister.unwrap(),
        contract_wasm_hash: get_contract_wasm_hash(state, &deployment.contract_template_id),
        expiration: deployment.created.saturating_add(certificate_duration),
        contract_template_id: deployment.contract_template_id,
    }
}

fn get_contract_wasm_hash(
    state: &CanisterState,
    contract_template_id: &ContractTemplateId,
) -> String {
    state
        .get_model()
        .get_contract_templates_storage()
        .get_contract_template(contract_template_id)
        .unwrap()
        .definition
        .wasm_hash
        .clone()
}
