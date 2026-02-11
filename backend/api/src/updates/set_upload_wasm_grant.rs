use candid::CandidType;
use serde::Deserialize;

use crate::types::UploadWasmGrant;

pub type Args = SetUploadWasmGrantArgs;
pub type Response = SetUploadWasmGrantResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct SetUploadWasmGrantArgs {
    pub grant: Option<UploadWasmGrant>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetUploadWasmGrantResponse {
    Ok,
    Err(SetUploadWasmGrantError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetUploadWasmGrantError {
    PermissionDenied,
    WasmLengthIsTooBig,
}

impl From<Result<(), SetUploadWasmGrantError>> for SetUploadWasmGrantResponse {
    fn from(r: Result<(), SetUploadWasmGrantError>) -> Self {
        match r {
            Ok(()) => SetUploadWasmGrantResponse::Ok,
            Err(error) => SetUploadWasmGrantResponse::Err(error),
        }
    }
}
