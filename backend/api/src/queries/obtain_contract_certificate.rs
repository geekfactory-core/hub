use candid::CandidType;
use common_contract_api::SignedContractCertificate;
use serde::Deserialize;

use crate::types::DeploymentId;

pub type Args = ObtainContractCertificateArgs;
pub type Response = ObtainContractCertificateResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct ObtainContractCertificateArgs {
    pub deployment_id: DeploymentId,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum ObtainContractCertificateResponse {
    Ok(ObtainContractCertificateResult),
    Err(ObtainContractCertificateError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct ObtainContractCertificateResult {
    pub certificate: SignedContractCertificate,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum ObtainContractCertificateError {
    DeploymentNotFound,
    PermissionDenied,
    DeploymentWrongState,
    BuildCertificateError { reason: String },
    CertificateNotFound,
}

impl From<Result<ObtainContractCertificateResult, ObtainContractCertificateError>>
    for ObtainContractCertificateResponse
{
    fn from(r: Result<ObtainContractCertificateResult, ObtainContractCertificateError>) -> Self {
        match r {
            Ok(result) => ObtainContractCertificateResponse::Ok(result),
            Err(error) => ObtainContractCertificateResponse::Err(error),
        }
    }
}
