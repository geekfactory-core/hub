use hub_canister_api::types::UploadWasmGrant;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Default)]
pub struct WasmStorage {
    current_upload_wasm: Option<CurrentUploadWasm>,
}

#[derive(Serialize, Deserialize)]
pub struct CurrentUploadWasm {
    grant: UploadWasmGrant,
    wasm: Vec<u8>,
}

impl WasmStorage {
    pub(crate) fn set_upload_wasm_grant(&mut self, upload_grant: Option<UploadWasmGrant>) {
        self.current_upload_wasm = upload_grant.map(|grant| CurrentUploadWasm {
            grant,
            wasm: Vec::new(),
        });
    }

    pub(crate) fn get_upload_wasm_grant(&self) -> Option<&UploadWasmGrant> {
        self.current_upload_wasm.as_ref().map(|op| &op.grant)
    }

    pub(crate) fn get_upload_wasm_mut_unsafe(&mut self) -> &mut Vec<u8> {
        self.current_upload_wasm.as_mut().unwrap().wasm.as_mut()
    }
}
