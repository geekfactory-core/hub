use candid::CandidType;
use serde::Deserialize;

use crate::types::Config;

pub type Args = SetConfigArgs;
pub type Response = SetConfigResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct SetConfigArgs {
    pub config: Config,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetConfigResponse {
    Ok,
    Err(SetConfigError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetConfigError {
    PermissionDenied,
    WrongConfig { reason: String },
}

impl From<Result<(), SetConfigError>> for SetConfigResponse {
    fn from(r: Result<(), SetConfigError>) -> Self {
        match r {
            Ok(_) => SetConfigResponse::Ok,
            Err(error) => SetConfigResponse::Err(error),
        }
    }
}
