use candid::{CandidType, Principal};
use common_canister_types::Timestamped;
use serde::Deserialize;

use crate::types::DeploymentId;

pub type Args = GetContractBlockStatusArgs;
pub type Response = GetContractBlockStatusResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct GetContractBlockStatusArgs {
    pub filter: ContractBlockFilter,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum ContractBlockFilter {
    ByDeploymentId { deployment_id: DeploymentId },
    ByContractCanisterId { canister_id: Principal },
}

#[derive(CandidType, Deserialize, Debug, PartialEq, Eq)]
pub enum GetContractBlockStatusResponse {
    Ok(GetContractBlockStatusResult),
    Err(GetContractBlockStatusError),
}

#[derive(CandidType, Deserialize, Debug, PartialEq, Eq)]
pub struct GetContractBlockStatusResult {
    pub blocked: Option<Timestamped<String>>,
}

#[derive(CandidType, Deserialize, Debug, PartialEq, Eq)]
pub enum GetContractBlockStatusError {
    DeploymentNotFound,
    ContractCanisterNotFound,
}

impl From<Result<GetContractBlockStatusResult, GetContractBlockStatusError>>
    for GetContractBlockStatusResponse
{
    fn from(result: Result<GetContractBlockStatusResult, GetContractBlockStatusError>) -> Self {
        match result {
            Ok(result) => GetContractBlockStatusResponse::Ok(result),
            Err(error) => GetContractBlockStatusResponse::Err(error),
        }
    }
}
