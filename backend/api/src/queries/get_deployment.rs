use candid::{CandidType, Principal};
use serde::Deserialize;

use crate::types::{DeploymentId, DeploymentInformation};

pub type Args = GetDeploymentArgs;
pub type Response = GetDeploymentResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct GetDeploymentArgs {
    pub filter: DeploymentFilter,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum DeploymentFilter {
    Active { deployer: Principal },
    ByDeploymentId { deployment_id: DeploymentId },
    ByContractCanisterId { canister_id: Principal },
    ByContractCanisterUrl { canister_url: String },
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetDeploymentResponse {
    Ok(Box<GetDeploymentResult>),
    Err(GetDeploymentError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetDeploymentResult {
    pub deployment: DeploymentInformation,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetDeploymentError {
    DeploymentNotFound,
}

impl From<Result<GetDeploymentResult, GetDeploymentError>> for GetDeploymentResponse {
    fn from(r: Result<GetDeploymentResult, GetDeploymentError>) -> Self {
        match r {
            Ok(result) => GetDeploymentResponse::Ok(Box::new(result)),
            Err(error) => GetDeploymentResponse::Err(error),
        }
    }
}
