use candid::{CandidType, Principal};
use common_canister_types::{
    DelayedTimestampMillis, LedgerAccount, TimestampMillis, Timestamped, TokenE8s,
};
use common_contract_api::{ContractTemplateId, SignedContractCertificate};
use serde::{Deserialize, Serialize};

use crate::types::CanisterSettings;

pub type DeploymentId = u64;
pub type DeploymentEventId = u64;

#[derive(CandidType, Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
pub enum DeploymentState {
    StartDeployment,
    TransferDeployerFundsToTransitAccount,
    TransferTopUpFundsToCMC,
    NotifyCMCTopUp {
        cmc_canister: Principal,
        block_index: u64,
    },
    CreateContractCanisterOverCMC,
    CreateContractCanisterOverManagement,
    GenerateContractCertificate,
    WaitingReceiveContractCertificate,
    StartInstallContractWasm {
        certificate: SignedContractCertificate,
    },
    UploadContractWasm {
        certificate: SignedContractCertificate,
        upload_chunk_size: usize,
        upload_chunk_count: usize,
        uploaded_chunk_hashes: Vec<Vec<u8>>,
    },
    InstallContractWasm {
        certificate: SignedContractCertificate,
        uploaded_chunk_hashes: Vec<Vec<u8>>,
    },
    MakeContractSelfControlled,
    FinalizeDeployment {
        result: DeploymentResult,
        sub_state: FinalizeDeploymentState,
    },
}

#[derive(CandidType, Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
pub enum FinalizeDeploymentState {
    StartDeploymentFinalization,
    TransferTransitFundsToExternalService,
    Finalized,
}

#[derive(CandidType, Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
pub enum DeploymentResult {
    Success,
    Cancelled { reason: String },
}

#[derive(CandidType, Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
pub enum DeploymentProcessingEvent {
    DeploymentStarted,
    DeployerFundsOnTransitAccountTransferred {
        transit_balance: TokenE8s,
        transfer_amount: TokenE8s,
        block_index: Option<u64>,
    },
    TopUpFundsToCMCTransferred {
        cmc_canister: Principal,
        transfer_amount: TokenE8s,
        block_index: u64,
    },
    TopUpCMCNotified {
        cycles: u128,
    },
    UseExternalServiceConverting {
        reason: String,
    },
    UseManagementCanisterCreation {
        reason: String,
    },
    ContractCanisterOverCMCCreated {
        settings: CanisterSettings,
        canister: Principal,
    },
    ContractCanisterOverManagementCreated {
        settings: CanisterSettings,
        canister: Principal,
    },
    ContractCertificateGenerated,
    RetryGenerateContractCertificate,
    ContractCertificateReceived {
        certificate: SignedContractCertificate,
    },
    InstallContractWasmStarted {
        upload_chunk_size: usize,
        upload_chunk_count: usize,
    },
    ReUploadContractWasm {
        reason: String,
    },
    ContractWasmChunkUploaded {
        chunk_index: usize,
        chunk_hash: Vec<u8>,
    },
    ContractWasmUploaded,
    ContractWasmInstalled,
    ContractSelfControlledMade,
    StartCompleteDeployment,
    TransitFundsToExternalServiceTransferred {
        block_index: Option<u64>,
        transfer_amount: TokenE8s,
    },
    DeploymentCanceled {
        reason: String,
    },
}

#[derive(CandidType, Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
pub struct DeploymentInformation {
    pub deployment_id: DeploymentId,
    pub deployer: Principal,
    pub created: TimestampMillis,
    pub contract_template_id: ContractTemplateId,
    pub deployment_expenses: DeploymentExpenses,
    pub expenses_amount: TokenE8s,
    pub approved_account: LedgerAccount,
    pub subnet_type: Option<String>,
    pub contract_canister: Option<Principal>,
    pub state: DeploymentState,
    pub processing_error: Option<Timestamped<String>>,
    pub need_processing: bool,
    pub lock: Option<DelayedTimestampMillis>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
pub struct DeploymentExpenses {
    pub deployment_cycles_cost: u128,
    pub contract_initial_cycles: u128,
    pub amount_buffer_permyriad: u64,
    pub amount_decimal_places: u8,
    pub icp_conversation_rate: IcpConversationRate,
}

#[derive(CandidType, Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
pub enum IcpConversationRate {
    CMC {
        xdr_permyriad_per_icp: u64,
        timestamp_seconds: u64,
    },
    Fixed {
        xdr_permyriad_per_icp: u64,
    },
}

impl IcpConversationRate {
    pub fn get_xdr_permyriad_per_icp(&self) -> u64 {
        match self {
            IcpConversationRate::CMC {
                xdr_permyriad_per_icp,
                ..
            } => *xdr_permyriad_per_icp,
            IcpConversationRate::Fixed {
                xdr_permyriad_per_icp,
            } => *xdr_permyriad_per_icp,
        }
    }
}
