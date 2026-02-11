use crate::components::Environment;
use crate::handlers::deployments::processor::ProcessingTaskResult;
use crate::handlers::deployments::states::{
    delay_processing, get_deployment_data, to_processing_error, update_deployment,
};
use crate::log_info;
use crate::model::deployments::DeploymentLock;
use candid::Encode;
use common_contract_api::{get_contract_activation_code_hash, get_wasm_hash_to_vec};
use hub_canister_api::types::{DeploymentId, DeploymentProcessingEvent, DeploymentState};
use ic_cdk::management_canister::{CanisterInstallMode, ChunkHash, InstallChunkedCodeArgs};

pub(crate) async fn process(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
) -> Result<ProcessingTaskResult, String> {
    let (contract_canister, certificate, activation_code, uploaded_chunk_hashes, wasm_module_hash) =
        get_deployment_data(deployment_id, |state, deployment| {
            match &deployment.state.value {
                DeploymentState::InstallContractWasm {
                    certificate,
                    uploaded_chunk_hashes,
                } => {
                    let wasm_module_hash = state
                        .get_model()
                        .get_contract_templates_storage()
                        .get_contract_template_wasm(&deployment.contract_template_id)
                        .map(|wasm| get_wasm_hash_to_vec(&wasm))
                        .unwrap();

                    (
                        deployment.contract_canister.unwrap(),
                        certificate.clone(),
                        deployment.activation_code.clone(),
                        uploaded_chunk_hashes.clone(),
                        wasm_module_hash,
                    )
                }
                _ => panic!(),
            }
        });

    // Install wasm

    let arg = InstallChunkedCodeArgs {
        mode: CanisterInstallMode::Reinstall,
        target_canister: contract_canister,
        store_canister: None,
        chunk_hashes_list: uploaded_chunk_hashes
            .iter()
            .map(|h| ChunkHash { hash: h.clone() })
            .collect(),
        wasm_module_hash,
        arg: Encode!(&common_contract_api::init_contract::Args {
            root_public_key_raw: env.get_ic().get_root_public_key_raw().to_vec(),
            certificate,
            contract_activation_code_hash: activation_code.map(get_contract_activation_code_hash)
        })
        .unwrap(),
    };

    env.get_ic_management()
        .install_chunked_code(arg)
        .await
        .map_err(to_processing_error)?;

    log_info!(
        env,
        "Deployment '{deployment_id}': installed contract WASM module."
    );

    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::ContractWasmInstalled,
    )?;

    Ok(delay_processing())
}
