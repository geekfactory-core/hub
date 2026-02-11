use candid::CandidType;
use common_contract_api::ContractTemplateId;
use serde::Deserialize;

use crate::types::ContractTemplateDefinition;

pub type Args = AddContractTemplateArgs;
pub type Response = AddContractTemplateResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct AddContractTemplateArgs {
    pub contract_template_definition: ContractTemplateDefinition,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum AddContractTemplateResponse {
    Ok(AddContractTemplateResult),
    Err(AddContractTemplateError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct AddContractTemplateResult {
    pub contract_template_id: ContractTemplateId,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum AddContractTemplateError {
    PermissionDenied,
    GrantNotFound,
    InvalidWasmLength { uploaded_length: usize },
    InvalidWasmHash { hash: String },
    ContractTemplateNameAlreadyExists,
    ContractTemplateWasmAlreadyExists,
    ContractNameIsTooLong { max_length: usize },
    ContractShortDescriptionIsTooLong { max_length: usize },
    ContractLongDescriptionIsTooLong { max_length: usize },
}

impl From<Result<AddContractTemplateResult, AddContractTemplateError>>
    for AddContractTemplateResponse
{
    fn from(r: Result<AddContractTemplateResult, AddContractTemplateError>) -> Self {
        match r {
            Ok(result) => AddContractTemplateResponse::Ok(result),
            Err(error) => AddContractTemplateResponse::Err(error),
        }
    }
}
