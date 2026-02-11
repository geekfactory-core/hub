use crate::{
    get_env, handlers::deployments::states::get_config, is_caller_has_access_right, log_info,
    mutate_state,
};
use hub_canister_api::{
    set_upload_wasm_grant::*,
    types::{Permission, UploadWasmGrant},
};
use ic_cdk_macros::update;

#[update]
fn set_upload_wasm_grant(Args { grant }: Args) -> Response {
    set_upload_wasm_grant_int(grant).into()
}

pub(crate) fn set_upload_wasm_grant_int(
    grant: Option<UploadWasmGrant>,
) -> Result<(), SetUploadWasmGrantError> {
    if !is_caller_has_access_right(&Permission::AddContractTemplate) {
        return Err(SetUploadWasmGrantError::PermissionDenied);
    }

    if let Some(UploadWasmGrant {
        wasm_length,
        operator,
    }) = &grant
    {
        if wasm_length > &get_config(|_, config| config.contract_wasm_max_size) {
            return Err(SetUploadWasmGrantError::WasmLengthIsTooBig);
        }
        log_info!(
            get_env(),
            "Upload WASM grant set: length = {wasm_length}, for operator = {}.",
            operator.to_text()
        );
    } else {
        log_info!(get_env(), "Upload WASM grant reset.");
    }

    mutate_state(|state| {
        state
            .get_model_mut()
            .get_wasm_storage_mut()
            .set_upload_wasm_grant(grant);
    });

    Ok(())
}
