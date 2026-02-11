use candid::{CandidType, Principal};
use common_canister_types::TimestampMillis;
use common_contract_api::SignedContractCertificate;
use serde::Deserialize;

pub type Args = ValidateContractCertificateArgs;
pub type Response = ValidateContractCertificateResponse;

#[derive(CandidType, Deserialize, Debug)]
pub enum ContractReference {
    Canister(Principal),
    Url(String),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct ValidateContractCertificateArgs {
    pub contract_reference: ContractReference,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum ValidateContractCertificateResponse {
    Ok(ValidateContractCertificateResult),
    Err(ValidateContractCertificateError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct ValidateContractCertificateResult {
    pub certificate: SignedContractCertificate,
    pub delay_to_expiration_millis: Option<TimestampMillis>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum ValidateContractCertificateError {
    ValidateContractUrlUnavailable { reason: String },
    InvalidContractReferenceUrl,
    CertificateUnavailable,
    ContractInfoUnavailable,
    CertificateWrong { reason: String },
}

impl From<Result<ValidateContractCertificateResult, ValidateContractCertificateError>>
    for ValidateContractCertificateResponse
{
    fn from(
        r: Result<ValidateContractCertificateResult, ValidateContractCertificateError>,
    ) -> Self {
        match r {
            Ok(result) => ValidateContractCertificateResponse::Ok(result),
            Err(error) => ValidateContractCertificateResponse::Err(error),
        }
    }
}
