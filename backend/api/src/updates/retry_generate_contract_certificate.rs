use crate::types::DeploymentId;
use candid::CandidType;
use common_canister_types::DelayedTimestampMillis;
use serde::Deserialize;

use super::process_deployment::ProcessDeploymentResult;

pub type Args = RetryGenerateContractCertificateArgs;
pub type Response = RetryGenerateContractCertificateResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct RetryGenerateContractCertificateArgs {
    pub deployment_id: DeploymentId,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum RetryGenerateContractCertificateResponse {
    Ok(Box<RetryGenerateContractCertificateResult>),
    Err(RetryGenerateContractCertificateError),
}

pub type RetryGenerateContractCertificateResult = ProcessDeploymentResult;

#[derive(CandidType, Deserialize, Debug)]
pub enum RetryGenerateContractCertificateError {
    DeploymentNotFound,
    PermissionDenied,
    DeploymentWrongState,
    DeploymentLocked { lock: DelayedTimestampMillis },
}

impl From<Result<RetryGenerateContractCertificateResult, RetryGenerateContractCertificateError>>
    for RetryGenerateContractCertificateResponse
{
    fn from(
        r: Result<RetryGenerateContractCertificateResult, RetryGenerateContractCertificateError>,
    ) -> Self {
        match r {
            Ok(result) => RetryGenerateContractCertificateResponse::Ok(Box::new(result)),
            Err(error) => RetryGenerateContractCertificateResponse::Err(error),
        }
    }
}
