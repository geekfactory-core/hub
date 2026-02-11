use crate::types::{DeploymentId, DeploymentInformation};
use candid::CandidType;
use serde::Deserialize;

pub type Args = ProcessDeploymentArgs;
pub type Response = ProcessDeploymentResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct ProcessDeploymentArgs {
    pub deployment_id: DeploymentId,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum ProcessDeploymentResponse {
    Ok(Box<ProcessDeploymentResult>),
    Err(ProcessDeploymentError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct ProcessDeploymentResult {
    pub deployment: DeploymentInformation,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum ProcessDeploymentError {
    DeploymentNotFound,
    PermissionDenied,
}

impl From<Result<ProcessDeploymentResult, ProcessDeploymentError>> for ProcessDeploymentResponse {
    fn from(r: Result<ProcessDeploymentResult, ProcessDeploymentError>) -> Self {
        match r {
            Ok(result) => ProcessDeploymentResponse::Ok(Box::new(result)),
            Err(error) => ProcessDeploymentResponse::Err(error),
        }
    }
}
