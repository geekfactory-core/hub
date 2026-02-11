use hub_canister_api::types::{DeploymentId, DeploymentProcessingEvent};
use ic_cdk::management_canister::ClearChunkStoreArgs;

use crate::components::Environment;
use crate::handlers::deployments::processor::ProcessingTaskResult;
use crate::handlers::deployments::states::{
    delay_processing, get_deployment_data, to_processing_error, update_deployment,
};
use crate::log_info;
use crate::model::deployments::DeploymentLock;

pub(crate) async fn process(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
) -> Result<ProcessingTaskResult, String> {
    let (contract_canister, upload_chunk_size, upload_chunk_count) =
        get_deployment_data(deployment_id, |state, deployment| {
            let contract_wasm = state
                .get_model()
                .get_contract_templates_storage()
                .get_contract_template_wasm(&deployment.contract_template_id)
                .unwrap();

            let upload_chunk_size = state
                .get_model()
                .get_config_storage()
                .get_config()
                .contract_wasm_upload_chunk_size;

            (
                deployment.contract_canister.unwrap(),
                upload_chunk_size,
                contract_wasm.len().div_ceil(upload_chunk_size),
            )
        });

    env.get_ic_management()
        .clear_chunk_store(ClearChunkStoreArgs {
            canister_id: contract_canister,
        })
        .await
        .map_err(to_processing_error)?;

    log_info!(
        env,
        "Deployment '{deployment_id}': installation of contract WASM started (chunk size: {upload_chunk_size}, total chunks: {upload_chunk_count})."
    );

    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::InstallContractWasmStarted {
            upload_chunk_size,
            upload_chunk_count,
        },
    )?;

    Ok(delay_processing())
}
