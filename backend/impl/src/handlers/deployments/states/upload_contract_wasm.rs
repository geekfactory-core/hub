use std::cmp::min;
use std::collections::HashSet;

use crate::components::Environment;
use crate::handlers::deployments::processor::ProcessingTaskResult;
use crate::handlers::deployments::states::{
    delay_processing, get_deployment_data, to_processing_error, update_deployment,
};
use crate::log_info;
use crate::model::deployments::DeploymentLock;
use candid::Principal;
use hub_canister_api::types::{DeploymentId, DeploymentProcessingEvent, DeploymentState};
use ic_cdk::management_canister::{StoredChunksArgs, UploadChunkArgs};

pub(crate) async fn process(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
) -> Result<ProcessingTaskResult, String> {
    let (
        contract_canister,
        wasm_module,
        upload_chunk_size,
        config_upload_chunk_size,
        upload_chunk_count,
        uploaded_chunk_hashes,
    ) = get_deployment_data(deployment_id, |state, deployment| {
        match &deployment.state.value {
            DeploymentState::UploadContractWasm {
                upload_chunk_size,
                upload_chunk_count,
                uploaded_chunk_hashes,
                ..
            } => {
                let contract_wasm = state
                    .get_model()
                    .get_contract_templates_storage()
                    .get_contract_template_wasm(&deployment.contract_template_id)
                    .unwrap();
                (
                    deployment.contract_canister.unwrap(),
                    contract_wasm,
                    *upload_chunk_size,
                    state
                        .get_model()
                        .get_config_storage()
                        .get_config()
                        .contract_wasm_upload_chunk_size,
                    *upload_chunk_count,
                    uploaded_chunk_hashes.clone(),
                )
            }
            _ => panic!(),
        }
    });

    let uploaded_chunk_count = uploaded_chunk_hashes.len();

    if uploaded_chunk_count < upload_chunk_count {
        // if upload chunk size changed - reupload wasm from start
        if upload_chunk_size != config_upload_chunk_size {
            return reupload_wasm(env, deployment_id, lock, "upload chunk size changed");
        }

        // Upload wasm chunk
        let chunk_index = uploaded_chunk_count;

        let chunk_hash = upload_wasm_chunk(
            env,
            deployment_id,
            &contract_canister,
            wasm_module,
            chunk_index,
            upload_chunk_size,
        )
        .await?;

        update_deployment(
            deployment_id,
            lock,
            DeploymentProcessingEvent::ContractWasmChunkUploaded {
                chunk_index,
                chunk_hash,
            },
        )?;
    } else {
        // check that all chunks are uploaded

        let canister_chunks_hash_set: HashSet<Vec<u8>> = env
            .get_ic_management()
            .stored_chunks(StoredChunksArgs {
                canister_id: contract_canister,
            })
            .await
            .map(|result| result.iter().map(|h| h.hash.clone()).collect())
            .map_err(to_processing_error)?;

        if canister_chunks_hash_set.len() != uploaded_chunk_count {
            return reupload_wasm(env, deployment_id, lock, "stored chunk count mismatch");
        }

        let is_absent_hash = uploaded_chunk_hashes
            .iter()
            .any(|h| !canister_chunks_hash_set.contains(h));

        if is_absent_hash {
            return reupload_wasm(env, deployment_id, lock, "chunk hash mismatch");
        }

        log_info!(
            env,
            "Deployment '{deployment_id}': all {uploaded_chunk_count} WASM chunks have been uploaded."
        );

        update_deployment(
            deployment_id,
            lock,
            DeploymentProcessingEvent::ContractWasmUploaded,
        )?;
    }

    Ok(delay_processing())
}

async fn upload_wasm_chunk(
    env: &Environment,
    deployment_id: &DeploymentId,
    canister_id: &Principal,
    wasm: Vec<u8>,
    upload_chunk_index: usize,
    chunk_size: usize,
) -> Result<Vec<u8>, String> {
    let from = chunk_size * upload_chunk_index;
    let to = min(from + chunk_size, wasm.len());

    let arg = UploadChunkArgs {
        canister_id: *canister_id,
        chunk: wasm[from..to].to_owned(),
    };

    let chunk_hash = env
        .get_ic_management()
        .upload_chunk(arg)
        .await
        .map_err(to_processing_error)?;

    log_info!(
        env,
        "Deployment '{deployment_id}': uploaded WASM module chunk {upload_chunk_index} [{from}..{to}]: {chunk_hash:?}."
    );

    Ok(chunk_hash.hash)
}

fn reupload_wasm(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
    reason: &str,
) -> Result<ProcessingTaskResult, String> {
    log_info!(
        env,
        "Deployment '{deployment_id}': re-uploading WASM module : {reason}"
    );

    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::ReUploadContractWasm {
            reason: reason.to_owned(),
        },
    )?;

    Ok(delay_processing())
}
