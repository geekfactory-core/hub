use candid::CandidType;
use serde::Deserialize;

use crate::types::AccessRight;

pub type Args = SetAccessRightsArgs;
pub type Response = SetAccessRightsResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct SetAccessRightsArgs {
    pub access_rights: Vec<AccessRight>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetAccessRightsResponse {
    Ok,
    Err(SetAccessRightsError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetAccessRightsError {
    PermissionDenied,
    LoseControlDangerous,
}

impl From<Result<(), SetAccessRightsError>> for SetAccessRightsResponse {
    fn from(r: Result<(), SetAccessRightsError>) -> Self {
        match r {
            Ok(_) => SetAccessRightsResponse::Ok,
            Err(error) => SetAccessRightsResponse::Err(error),
        }
    }
}
