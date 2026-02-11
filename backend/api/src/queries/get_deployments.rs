use candid::{CandidType, Principal};
use common_canister_types::{ChunkDef, SortingDefinition};
use common_contract_api::ContractTemplateId;
use serde::Deserialize;

use crate::types::DeploymentInformation;

pub type Args = GetDeploymentsArgs;
pub type Response = GetDeploymentsResponse;

#[derive(CandidType, Deserialize, Debug)]
pub enum DeploymentsSelector {
    All,
    ByContractTemplate {
        contract_template_id: ContractTemplateId,
    },
    ByDeployer {
        deployer: Principal,
        contract_template_id: Option<ContractTemplateId>,
    },
}

#[derive(CandidType, Deserialize, Debug)]
pub enum DeploymentsSortingKey {
    DeploymentId,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetDeploymentsArgs {
    pub chunk_def: ChunkDef,
    pub selector: DeploymentsSelector,
    pub sorting: Option<SortingDefinition<DeploymentsSortingKey>>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetDeploymentsResponse {
    Ok(GetDeploymentsResult),
    Err(GetDeploymentsError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetDeploymentsError {
    ChunkCountExceedsLimit { max_chunk_count: usize },
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetDeploymentsResult {
    pub deployments: Vec<DeploymentInformation>,
    pub total_count: usize,
}

impl From<Result<GetDeploymentsResult, GetDeploymentsError>> for GetDeploymentsResponse {
    fn from(result: Result<GetDeploymentsResult, GetDeploymentsError>) -> Self {
        match result {
            Ok(result) => GetDeploymentsResponse::Ok(result),
            Err(error) => GetDeploymentsResponse::Err(error),
        }
    }
}
