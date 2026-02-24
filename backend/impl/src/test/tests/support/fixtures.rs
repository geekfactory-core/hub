#![allow(dead_code)]

use hub_canister_api::types::{CanisterSettings, ContractTemplateDefinition};

/// Default WASM bytes used in tests (10 bytes).
pub const TEST_WASM: &[u8] = &[1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/// Initial cycles provisioned to each deployed contract canister in tests.
pub const TEST_CONTRACT_INITIAL_CYCLES: u128 = 9_000_000_000;

/// XDR permyriad per ICP used in deployment tests (20_000 = 2.0 XDR/ICP).
pub const TEST_XDR_PERMYRIAD_PER_ICP: u64 = 20_000;

/// Deployment cycles cost used in tests.
pub const TEST_DEPLOYMENT_CYCLES_COST: u128 = 1_000_000_000;

/// Allowance expiration timeout (ms) used in tests.
pub const TEST_DEPLOYMENT_ALLOWANCE_EXPIRATION_TIMEOUT: u64 = 60_000;

/// Minimum ICP e8s required to cover a deployment at the standard test rates,
/// without any buffer:
///   (TEST_CONTRACT_INITIAL_CYCLES + TEST_DEPLOYMENT_CYCLES_COST) / TEST_XDR_PERMYRIAD_PER_ICP
pub fn test_deployment_expenses_amount() -> u64 {
    ((TEST_CONTRACT_INITIAL_CYCLES + TEST_DEPLOYMENT_CYCLES_COST)
        / TEST_XDR_PERMYRIAD_PER_ICP as u128) as u64
}

/// Returns a minimal valid [`ContractTemplateDefinition`] for use in tests.
/// The `wasm_hash` field is intentionally left empty — callers that need a
/// real hash should override it after calling this function.
pub fn ht_get_face_contract_def() -> ContractTemplateDefinition {
    ContractTemplateDefinition {
        name: "name".to_string(),
        wasm_hash: "".to_string(),
        short_description: "short_description".to_string(),
        long_description: Some("long_description".to_string()),
        source_url: "source_url".to_string(),
        source_tag: "source_tag".to_string(),
        activation_required: true,
        certificate_duration: 20_000,
        contract_canister_settings: CanisterSettings {
            initial_cycles: TEST_CONTRACT_INITIAL_CYCLES,
            compute_allocation: None,
            memory_allocation: None,
            freezing_threshold: None,
            reserved_cycles_limit: None,
            wasm_memory_limit: None,
            wasm_memory_threshold: None,
            environment_variables: None,
        },
        documentation_url: "documentation_url".to_string(),
        terms_of_use_url: "terms_of_use_url".to_string(),
    }
}
