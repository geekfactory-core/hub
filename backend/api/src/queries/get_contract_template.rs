use candid::CandidType;
use common_contract_api::ContractTemplateId;
use serde::Deserialize;

use crate::types::ContractTemplateInformation;

pub type Args = GetContractTemplateArgs;
pub type Response = GetContractTemplateResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct GetContractTemplateArgs {
    pub contract_template_id: ContractTemplateId,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetContractTemplateResponse {
    Ok(Box<GetContractTemplateResult>),
    Err(GetContractTemplateError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetContractTemplateResult {
    pub contract_template: ContractTemplateInformation,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetContractTemplateError {
    ContractTemplateNotFound,
}

impl From<Result<GetContractTemplateResult, GetContractTemplateError>>
    for GetContractTemplateResponse
{
    fn from(r: Result<GetContractTemplateResult, GetContractTemplateError>) -> Self {
        match r {
            Ok(result) => GetContractTemplateResponse::Ok(Box::new(result)),
            Err(error) => GetContractTemplateResponse::Err(error),
        }
    }
}
