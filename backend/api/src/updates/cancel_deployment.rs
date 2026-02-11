use crate::types::DeploymentId;
use candid::CandidType;
use common_canister_types::DelayedTimestampMillis;
use serde::Deserialize;

use super::process_deployment::ProcessDeploymentResult;

pub type Args = CancelDeploymentArgs;
pub type Response = CancelDeploymentResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct CancelDeploymentArgs {
    pub deployment_id: DeploymentId,
    pub reason: String,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum CancelDeploymentResponse {
    Ok(Box<CancelDeploymentResult>),
    Err(CancelDeploymentError),
}

pub type CancelDeploymentResult = ProcessDeploymentResult;

#[derive(CandidType, Deserialize, Debug)]
pub enum CancelDeploymentError {
    DeploymentNotFound,
    PermissionDenied,
    DeploymentWrongState,
    DeploymentLocked { lock: DelayedTimestampMillis },
}

impl From<Result<CancelDeploymentResult, CancelDeploymentError>> for CancelDeploymentResponse {
    fn from(r: Result<CancelDeploymentResult, CancelDeploymentError>) -> Self {
        match r {
            Ok(result) => CancelDeploymentResponse::Ok(Box::new(result)),
            Err(error) => CancelDeploymentResponse::Err(error),
        }
    }
}
