use candid::{CandidType, Principal};
use common_canister_types::Timestamped;
use serde::Deserialize;

use crate::types::DeploymentId;

pub type Args = GetContractBlockStatusArgs;
pub type Response = GetContractBlockStatusResult;

#[derive(CandidType, Deserialize, Debug)]
pub struct GetContractBlockStatusArgs {
    pub filter: ContractBlockFilter,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum ContractBlockFilter {
    ByDeploymentId { deployment_id: DeploymentId },
    ByContractCanisterId { canister_id: Principal },
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetContractBlockStatusResult {
    pub blocked: Option<Timestamped<String>>,
}
