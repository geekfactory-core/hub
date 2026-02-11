use candid::CandidType;
use serde::Deserialize;

use crate::types::Config;

#[derive(CandidType, Deserialize, Debug)]
pub struct Args {}

pub type Response = GetConfigResponse;

#[derive(CandidType, Deserialize, Debug)]
pub enum GetConfigResponse {
    Ok(GetConfigResult),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetConfigResult {
    pub config: Config,
}
