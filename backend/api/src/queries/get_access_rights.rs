use candid::CandidType;
use serde::Deserialize;

use crate::types::AccessRight;

#[derive(CandidType, Deserialize, Debug)]
pub struct Args {}

pub type Response = GetAccessRightsResponse;

#[derive(CandidType, Deserialize, Debug)]
pub enum GetAccessRightsResponse {
    Ok(GetAccessRightsResult),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetAccessRightsResult {
    pub access_rights: Vec<AccessRight>,
}
