use candid::CandidType;
use common_contract_api::ContractActivationCode;
use serde::Deserialize;

use crate::types::DeploymentId;

pub type Args = GetContractActivationCodeArgs;
pub type Response = GetContractActivationCodeResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct GetContractActivationCodeArgs {
    pub deployment_id: DeploymentId,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetContractActivationCodeResponse {
    Ok(GetContractActivationCodeResult),
    Err(GetContractActivationCodeError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetContractActivationCodeResult {
    pub code: ContractActivationCode,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetContractActivationCodeError {
    DeploymentNotFound,
    PermissionDenied,
    ContractActivationNotRequired,
}

impl From<Result<GetContractActivationCodeResult, GetContractActivationCodeError>>
    for GetContractActivationCodeResponse
{
    fn from(r: Result<GetContractActivationCodeResult, GetContractActivationCodeError>) -> Self {
        match r {
            Ok(result) => GetContractActivationCodeResponse::Ok(result),
            Err(error) => GetContractActivationCodeResponse::Err(error),
        }
    }
}
