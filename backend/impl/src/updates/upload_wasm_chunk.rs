use hub_canister_api::{types::UploadWasmGrant, upload_wasm_chunk::*};
use ic_cdk_macros::update;

use crate::{get_env, log_info, mutate_state, read_state};

#[update]
fn upload_wasm_chunk(Args { first, chunk }: Args) -> Response {
    upload_wasm_chunk_int(first, chunk).into()
}

pub(crate) fn upload_wasm_chunk_int(
    first: bool,
    chunk: Vec<u8>,
) -> Result<UploadWasmChunkResult, UploadWasmChunkError> {
    let upload_grant = get_upload_grant()?;
    check_permission(&upload_grant)?;

    mutate_state(|state| {
        let env = state.get_env();

        let wasm = state
            .get_model_mut()
            .get_wasm_storage_mut()
            .get_upload_wasm_mut_unsafe();

        // check overflow
        let chunk_size = chunk.len();
        let mut new_size = chunk_size;
        if !first {
            new_size += wasm.len();
        };

        if new_size > upload_grant.wasm_length {
            return Err(UploadWasmChunkError::WasmLengthOverflow);
        }

        // update wasm
        if first {
            wasm.clear();
        }
        wasm.extend(chunk);

        log_info!(
            env,
            "WASM chunk uploaded successfully: chunk size = {chunk_size} bytes, uploaded so far = {} bytes.",
            wasm.len()
        );

        Ok(UploadWasmChunkResult {
            uploaded_length: wasm.len(),
        })
    })
}

fn get_upload_grant() -> Result<UploadWasmGrant, UploadWasmChunkError> {
    read_state(|state| {
        state
            .get_model()
            .get_wasm_storage()
            .get_upload_wasm_grant()
            .cloned()
            .ok_or(UploadWasmChunkError::GrantNotFound)
    })
}

/// Only grant operator has permission for upload.
fn check_permission(grant: &UploadWasmGrant) -> Result<(), UploadWasmChunkError> {
    if get_env().get_ic().get_caller() == grant.operator {
        Ok(())
    } else {
        Err(UploadWasmChunkError::PermissionDenied)
    }
}
