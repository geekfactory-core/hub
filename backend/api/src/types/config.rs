use candid::{CandidType, Principal};
use common_canister_types::TimestampMillis;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq, Default)]
pub struct Config {
    pub contract_wasm_max_size: usize,
    pub contract_wasm_upload_chunk_size: usize,
    pub regex_for_contract_principal_parsing: Vec<String>,
    pub is_deployment_available: bool,
    pub deployment_cycles_cost: u128,
    pub deployment_expenses_amount_buffer_permyriad: u64,
    pub deployment_expenses_amount_decimal_places: u8,
    pub deployment_allowance_expiration_timeout: TimestampMillis,
    pub icp_xdr_conversion_rate_strategy: IcpXdrConversionRateStrategy,
    pub cycles_converting_strategy: CyclesConvertingStrategy,
    pub contract_canister_creation_strategy: CreateContractCanisterStrategy,
    pub deployment_fallback_account_hex: String,
    pub max_hub_events_per_chunk: usize,
    pub max_contract_templates_per_chunk: usize,
    pub max_deployments_per_chunk: usize,
    pub max_deployment_events_per_chunk: usize,
    pub contract_url_pattern: String,
    pub name_max_length: usize,
    pub short_description_max_length: usize,
    pub long_description_max_length: usize,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum IcpXdrConversionRateStrategy {
    CMC { cmc_canister: Principal },
    Fixed { xdr_permyriad_per_icp: u64 },
}

impl Default for IcpXdrConversionRateStrategy {
    fn default() -> Self {
        IcpXdrConversionRateStrategy::Fixed {
            xdr_permyriad_per_icp: 30_000,
        }
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq, Default)]
pub enum CyclesConvertingStrategy {
    CMCTopUp {
        cmc_canister: Principal,
    },
    #[default]
    Skip,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq, Default)]
pub enum CreateContractCanisterStrategy {
    OverCMC {
        cmc_canister: Principal,
    },
    #[default]
    OverManagementCanister,
}
