use candid::CandidType;
use common_contract_api::ContractTemplateId;
use serde::Deserialize;

pub type Args = BlockContractTemplateArgs;
pub type Response = BlockContractTemplateResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct BlockContractTemplateArgs {
    pub contract_template_id: ContractTemplateId,
    pub reason: String,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum BlockContractTemplateResponse {
    Ok,
    Err(BlockContractTemplateError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum BlockContractTemplateError {
    PermissionDenied,
    ContractTemplateNotFound,
    ContractTemplateAlreadyBlocked,
}

impl From<Result<(), BlockContractTemplateError>> for BlockContractTemplateResponse {
    fn from(r: Result<(), BlockContractTemplateError>) -> Self {
        match r {
            Ok(_) => BlockContractTemplateResponse::Ok,
            Err(error) => BlockContractTemplateResponse::Err(error),
        }
    }
}
