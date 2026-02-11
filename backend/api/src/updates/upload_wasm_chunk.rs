use candid::CandidType;
use serde::Deserialize;

pub type Args = UploadWasmChunkArgs;
pub type Response = UploadWasmChunkResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct UploadWasmChunkArgs {
    pub first: bool,
    pub chunk: Vec<u8>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum UploadWasmChunkResponse {
    Ok(UploadWasmChunkResult),
    Err(UploadWasmChunkError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct UploadWasmChunkResult {
    pub uploaded_length: usize,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum UploadWasmChunkError {
    GrantNotFound,
    PermissionDenied,
    WasmLengthOverflow,
}

impl From<Result<UploadWasmChunkResult, UploadWasmChunkError>> for UploadWasmChunkResponse {
    fn from(r: Result<UploadWasmChunkResult, UploadWasmChunkError>) -> Self {
        match r {
            Ok(result) => UploadWasmChunkResponse::Ok(result),
            Err(error) => UploadWasmChunkResponse::Err(error),
        }
    }
}
