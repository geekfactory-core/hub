use crate::types::DeploymentInformation;
use candid::CandidType;
use common_canister_types::LedgerAccount;
use common_contract_api::ContractTemplateId;
use serde::Deserialize;

use super::process_deployment::ProcessDeploymentResult;

pub type Args = DeployContractArgs;
pub type Response = DeployContractResponse;

#[derive(CandidType, Deserialize, Debug)]
pub struct DeployContractArgs {
    pub approved_account: LedgerAccount,
    pub contract_template_id: ContractTemplateId,
    pub subnet_type: Option<String>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum DeployContractResponse {
    Ok(Box<DeployContractResult>),
    Err(DeployContractError),
}

pub type DeployContractResult = ProcessDeploymentResult;

#[derive(CandidType, Deserialize, Debug)]
pub enum DeployContractError {
    CallerNotAuthorized,
    DeploymentUnavailable,
    ActiveDeploymentExists {
        deployment: Box<DeploymentInformation>,
    },
    ContractTemplateNotFound,
    ContractTemplateBlocked,
    InvalidApprovedAccount {
        reason: String,
    },
    LedgerUnavailable {
        reason: String,
    },
    InsufficientApprovedAccountBalance,
    InsufficientApprovedAccountAllowance,
    AllowanceExpiresTooEarly,
    GetIcpXdrConversionRateError {
        reason: String,
    },
    CalculateDeploymentExpensesError {
        reason: String,
    },
    GenerateActivationCodeError {
        reason: String,
    },
}

impl From<Result<DeployContractResult, DeployContractError>> for DeployContractResponse {
    fn from(r: Result<DeployContractResult, DeployContractError>) -> Self {
        match r {
            Ok(result) => DeployContractResponse::Ok(Box::new(result)),
            Err(error) => DeployContractResponse::Err(error),
        }
    }
}
