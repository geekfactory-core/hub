use candid::CandidType;
use common_contract_api::ContractTemplateId;
use serde::Deserialize;

pub type Args = SetContractTemplateRetiredArgs;
pub type Response = SetContractTemplateRetiredResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct SetContractTemplateRetiredArgs {
    pub contract_template_id: ContractTemplateId,
    pub reason: Option<String>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetContractTemplateRetiredResponse {
    Ok,
    Err(SetContractTemplateRetiredError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum SetContractTemplateRetiredError {
    PermissionDenied,
    ContractTemplateNotFound,
}

impl From<Result<(), SetContractTemplateRetiredError>> for SetContractTemplateRetiredResponse {
    fn from(r: Result<(), SetContractTemplateRetiredError>) -> Self {
        match r {
            Ok(_) => SetContractTemplateRetiredResponse::Ok,
            Err(error) => SetContractTemplateRetiredResponse::Err(error),
        }
    }
}
