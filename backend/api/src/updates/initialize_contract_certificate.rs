use candid::CandidType;
use common_canister_types::DelayedTimestampMillis;
use common_contract_api::SignedContractCertificate;
use serde::Deserialize;

use crate::types::DeploymentId;

use super::process_deployment::ProcessDeploymentResult;

pub type Args = InitializeContractCertificateArgs;
pub type Response = InitializeContractCertificateResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct InitializeContractCertificateArgs {
    pub deployment_id: DeploymentId,
    pub certificate: SignedContractCertificate,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum InitializeContractCertificateResponse {
    Ok(Box<InitializeContractCertificateResult>),
    Err(InitializeContractCertificateError),
}

pub type InitializeContractCertificateResult = ProcessDeploymentResult;

#[derive(CandidType, Deserialize, Debug)]
pub enum InitializeContractCertificateError {
    DeploymentNotFound,
    PermissionDenied,
    DeploymentWrongState,
    InvalidCertificate { reason: String },
    DeploymentLocked { lock: DelayedTimestampMillis },
}

impl From<Result<InitializeContractCertificateResult, InitializeContractCertificateError>>
    for InitializeContractCertificateResponse
{
    fn from(
        r: Result<InitializeContractCertificateResult, InitializeContractCertificateError>,
    ) -> Self {
        match r {
            Ok(result) => InitializeContractCertificateResponse::Ok(Box::new(result)),
            Err(error) => InitializeContractCertificateResponse::Err(error),
        }
    }
}
