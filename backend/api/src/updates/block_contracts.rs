use candid::{CandidType, Principal};
use serde::Deserialize;

pub type Args = BlockContractsArgs;
pub type Response = BlockContractsResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct BlockContractsArgs {
    pub contract_canister_ids: Vec<Principal>,
    pub reason: String,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum BlockContractsResponse {
    Ok,
    Err(BlockContractsError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum BlockContractsError {
    PermissionDenied,
}

impl From<Result<(), BlockContractsError>> for BlockContractsResponse {
    fn from(r: Result<(), BlockContractsError>) -> Self {
        match r {
            Ok(_) => BlockContractsResponse::Ok,
            Err(error) => BlockContractsResponse::Err(error),
        }
    }
}
