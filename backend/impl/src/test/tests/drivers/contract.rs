use candid::Principal;
use common_contract_api::get_wasm_hash;
use common_contract_api::ContractTemplateId;
use hub_canister_api::{
    add_contract_template::AddContractTemplateResult,
    types::{AccessRight, Config, ContractTemplateDefinition, Permission, UploadWasmGrant},
};

use crate::{
    read_state,
    test::tests::{
        components::ic::ht_set_test_caller, ht_get_test_user, ht_init_test_hub,
        ht_set_initial_config,
    },
    updates::{
        add_contract_template::add_contract_template_int, set_access_rights::set_access_rights_int,
        set_config::set_config_int, set_upload_wasm_grant::set_upload_wasm_grant_int,
        upload_wasm_chunk::upload_wasm_chunk_int,
    },
};

/// Initialises the hub and adds a contract template, returning the assigned
/// [`ContractTemplateId`].
///
/// This helper is the canonical way to reach the "contract template exists"
/// state in a test without repeating the full setup boilerplate.
///
/// What this driver does:
/// 1. Calls [`ht_init_test_hub`] (resets canister state).
/// 2. Sets the minimum permissions required to add a contract template.
/// 3. Calls [`ht_set_initial_config`].
/// 4. Derives the WASM hash from `wasm` and patches `contract_def`.
/// 5. Sets `contract_wasm_max_size` in config.
/// 6. Issues an upload-wasm grant to the test-user operator.
/// 7. Uploads the WASM as the operator.
/// 8. Adds the contract template as `admin` and returns the id.
pub(crate) fn ht_add_contract(
    admin: Principal,
    contract_def: ContractTemplateDefinition,
    wasm: Vec<u8>,
) -> ContractTemplateId {
    ht_init_test_hub();

    ht_set_test_caller(admin);

    let result = set_access_rights_int(vec![AccessRight {
        caller: admin,
        permissions: Some(vec![
            Permission::SetAccessRights,
            Permission::SetConfig,
            Permission::AddContractTemplate,
        ]),
        description: None,
    }]);
    assert!(result.is_ok(), "set_access_rights failed: {:?}", result);
    ht_set_initial_config();

    let wasm_hash = get_wasm_hash(&wasm);
    let contract_def = ContractTemplateDefinition {
        wasm_hash,
        ..contract_def
    };

    let contract_wasm_max_size = wasm.len();
    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let result = set_config_int(Config {
        contract_wasm_max_size,
        ..config
    });
    assert!(
        result.is_ok(),
        "set_config (wasm size) failed: {:?}",
        result
    );

    // Grant upload permission to the operator.
    let operator = ht_get_test_user();
    let result = set_upload_wasm_grant_int(Some(UploadWasmGrant {
        operator,
        wasm_length: contract_wasm_max_size,
    }));
    assert!(result.is_ok(), "set_upload_wasm_grant failed: {:?}", result);

    // Upload WASM as the operator.
    ht_set_test_caller(operator);
    let result = upload_wasm_chunk_int(true, wasm.clone());
    assert!(result.is_ok(), "upload_wasm_chunk failed: {:?}", result);

    // Add the contract template as the admin.
    ht_set_test_caller(admin);
    match add_contract_template_int(contract_def.clone()) {
        Ok(AddContractTemplateResult {
            contract_template_id,
        }) => contract_template_id,
        Err(error) => panic!("ht_add_contract: add_contract_template_int failed: {error:?}"),
    }
}
