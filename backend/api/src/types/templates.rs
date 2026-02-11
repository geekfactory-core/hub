use candid::{CandidType, Principal};
use common_canister_types::{TimestampMillis, Timestamped};
use common_contract_api::{ContractTemplateId, WasmHash};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Deserialize, Debug)]
pub struct ContractTemplateInformation {
    pub contract_template_id: ContractTemplateId,
    pub registrar: Principal,
    pub registered: TimestampMillis,
    pub definition: ContractTemplateDefinition,
    pub blocked: Option<Timestamped<String>>,
    pub deployments_count: usize,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UploadWasmGrant {
    pub operator: Principal,
    pub wasm_length: usize,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ContractTemplateDefinition {
    pub name: String,
    pub short_description: String,
    pub long_description: Option<String>,
    pub source_url: String,
    pub source_tag: String,
    pub wasm_hash: WasmHash,
    pub activation_required: bool,
    pub certificate_duration: TimestampMillis,
    pub contract_canister_settings: CanisterSettings,
    pub documentation_url: String,
    pub terms_of_use_url: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
pub struct CanisterSettings {
    pub initial_cycles: u128,

    /// A value between 0 and 100 (inclusive).
    /// Represents the compute allocation for the canister.
    /// Default: `0`.
    pub compute_allocation: Option<u128>,

    /// A value between `0` and `2^48` (256 TB, inclusive).
    /// Represents the memory allocation for the canister.
    /// Default: `0`.
    pub memory_allocation: Option<u128>,

    /// A value between `0` and `2^64 - 1` (inclusive).
    /// Represents the freezing threshold in seconds.
    /// Default: `2_592_000` (≈ 30 days).
    pub freezing_threshold: Option<u128>,

    /// A value between `0` and `2^128 - 1` (inclusive).
    /// Represents the upper limit for the canister’s reserved cycles.
    /// Default: `5_000_000_000_000` (5 trillion cycles).
    pub reserved_cycles_limit: Option<u128>,

    /// A value between `0` and `2^48 - 1` (256 TB, inclusive).
    /// Represents the upper limit for the canister’s WASM heap memory.
    /// Default: `3_221_225_472` (3 GiB).
    pub wasm_memory_limit: Option<u128>,

    /// Indicates the threshold on the remaining wasm memory size of the canister in bytes.
    ///
    /// If the remaining wasm memory size of the canister is below the threshold, execution of the "on low wasm memory" hook is scheduled.
    ///
    /// Must be a number between 0 and 2<sup>64</sup>-1, inclusively.
    ///
    /// Default value: `0` (i.e., the "on low wasm memory" hook is never scheduled).
    pub wasm_memory_threshold: Option<u128>,

    /// A list of environment variables.
    ///
    /// These variables are accessible to the canister during execution
    /// and can be used to configure canister behavior without code changes.
    /// Each key must be unique.
    ///
    /// Default value: `null` (i.e., no environment variables provided).
    pub environment_variables: Option<Vec<(String, String)>>,
}
