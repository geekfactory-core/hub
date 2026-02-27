use candid::CandidType;
use common_canister_types::{ChunkDef, SortingDefinition};
use serde::Deserialize;

use crate::types::ContractTemplateInformation;

pub type Args = GetContractTemplatesArgs;
pub type Response = GetContractTemplatesResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct ContractTemplatesFilter {
    pub filter: Option<String>,
    pub blocked: Option<bool>,
    pub retired: Option<bool>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum ContractTemplatesSortingKey {
    ContractTemplateId,
    Registered,
    DeploymentsCount,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetContractTemplatesArgs {
    pub chunk_def: ChunkDef,
    pub filter: Option<ContractTemplatesFilter>,
    pub sorting: Option<SortingDefinition<ContractTemplatesSortingKey>>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetContractTemplatesResponse {
    Ok(GetContractTemplatesResult),
    Err(GetContractTemplatesError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetContractTemplatesResult {
    pub contract_templates: Vec<ContractTemplateInformation>,
    pub total_count: usize,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetContractTemplatesError {
    FilterTextTooShort,
    FilterTextTooLong,
    ChunkCountExceedsLimit { max_chunk_count: usize },
}

impl From<Result<GetContractTemplatesResult, GetContractTemplatesError>>
    for GetContractTemplatesResponse
{
    fn from(result: Result<GetContractTemplatesResult, GetContractTemplatesError>) -> Self {
        match result {
            Ok(result) => GetContractTemplatesResponse::Ok(result),
            Err(error) => GetContractTemplatesResponse::Err(error),
        }
    }
}
