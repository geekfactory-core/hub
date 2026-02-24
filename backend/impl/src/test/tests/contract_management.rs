use common_contract_api::get_wasm_hash;
use hub_canister_api::{
    add_contract_template::{AddContractTemplateError, AddContractTemplateResult},
    block_contract_template::BlockContractTemplateError,
    set_contract_template_retired::SetContractTemplateRetiredError,
    set_upload_wasm_grant::SetUploadWasmGrantError,
    types::{
        AccessRight, Config, ContractTemplateDefinition, HubEventType, Permission, UploadWasmGrant,
    },
    upload_wasm_chunk::UploadWasmChunkError,
};

use crate::{
    ht_last_hub_event_matches, ht_result_err_matches,
    queries::get_contract_template::get_contract_template_int,
    read_state,
    test::tests::{
        components::ic::ht_set_test_caller,
        drivers::contract::ht_add_contract,
        ht_get_test_admin, ht_get_test_user, ht_init_test_hub, ht_set_initial_config,
        support::fixtures::{ht_get_face_contract_def, TEST_WASM},
    },
    updates::{
        add_contract_template::add_contract_template_int,
        block_contract_template::block_contract_template_int,
        set_access_rights::set_access_rights_int, set_config::set_config_int,
        set_contract_template_retired::set_contract_template_retired_int,
        set_upload_wasm_grant::set_upload_wasm_grant_int, upload_wasm_chunk::upload_wasm_chunk_int,
    },
};

#[test]
fn test_add_contract() {
    ht_init_test_hub();

    let admin = ht_get_test_admin();
    ht_set_test_caller(admin);

    let result = set_access_rights_int(vec![AccessRight {
        caller: admin,
        permissions: Some(vec![Permission::SetAccessRights, Permission::SetConfig]),
        description: None,
    }]);
    assert!(result.is_ok());
    ht_set_initial_config();

    let wrong_wasm = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 11];
    let wasm = TEST_WASM.to_vec();
    let wasm_hash = get_wasm_hash(&wasm);
    let contract_wasm_max_size = wasm.len();
    let contract_def = ContractTemplateDefinition {
        wasm_hash,
        ..ht_get_face_contract_def()
    };

    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let result = set_config_int(Config {
        contract_wasm_max_size,
        ..config
    });
    assert!(result.is_ok());

    // PERMISSION DENIED TEST
    let result = add_contract_template_int(contract_def.clone());
    ht_result_err_matches!(result, AddContractTemplateError::PermissionDenied);

    // ADD PERMISSION
    let result = set_access_rights_int(vec![AccessRight {
        caller: admin,
        permissions: Some(vec![
            Permission::SetAccessRights,
            Permission::AddContractTemplate,
        ]),
        description: None,
    }]);
    assert!(result.is_ok());

    // GRANT NOT FOUND TEST
    let result = add_contract_template_int(contract_def.clone());
    ht_result_err_matches!(result, AddContractTemplateError::GrantNotFound);

    let result = upload_wasm_chunk_int(true, vec![1]);
    ht_result_err_matches!(result, UploadWasmChunkError::GrantNotFound);

    // ADD GRANT PERMISSION DENIED TEST
    let operator = ht_get_test_user();
    ht_set_test_caller(operator);
    let result = set_upload_wasm_grant_int(Some(UploadWasmGrant {
        operator,
        wasm_length: 12,
    }));
    ht_result_err_matches!(result, SetUploadWasmGrantError::PermissionDenied);

    // ADD GRANT WRONG WASM TEST
    ht_set_test_caller(admin);
    let result = set_upload_wasm_grant_int(Some(UploadWasmGrant {
        operator,
        wasm_length: contract_wasm_max_size + 1,
    }));
    ht_result_err_matches!(result, SetUploadWasmGrantError::WasmLengthIsTooBig);

    // ADD GRANT SUCCESS TEST
    let result = set_upload_wasm_grant_int(Some(UploadWasmGrant {
        operator,
        wasm_length: contract_wasm_max_size,
    }));
    assert!(result.is_ok());

    // ADD INVALID WASM LENGTH TEST
    let result = add_contract_template_int(contract_def.clone());
    ht_result_err_matches!(result, AddContractTemplateError::InvalidWasmLength { .. });

    // UPLOAD WASM PERMISSION DENIED TEST
    let result = upload_wasm_chunk_int(true, vec![1]);
    ht_result_err_matches!(result, UploadWasmChunkError::PermissionDenied);

    // UPLOAD WRONG WASM SUCCESS TEST
    ht_set_test_caller(operator);
    let result = upload_wasm_chunk_int(true, wrong_wasm.clone());
    assert!(result.is_ok());

    let result = upload_wasm_chunk_int(true, wrong_wasm.clone());
    assert!(result.is_ok());

    let result = upload_wasm_chunk_int(false, vec![1]);
    ht_result_err_matches!(result, UploadWasmChunkError::WasmLengthOverflow);

    // ADD CONTRACT INVALID WASM HASH TEST
    ht_set_test_caller(admin);
    let result = add_contract_template_int(contract_def.clone());
    ht_result_err_matches!(result, AddContractTemplateError::InvalidWasmHash { .. });

    // UPLOAD WASM SUCCESS TEST
    ht_set_test_caller(operator);
    let result = upload_wasm_chunk_int(true, wasm.clone());
    assert!(result.is_ok());

    // ADD CONTRACT SUCCESS TEST
    ht_set_test_caller(admin);
    let result = add_contract_template_int(contract_def.clone());
    let contract_template_id = match result {
        Ok(AddContractTemplateResult {
            contract_template_id,
        }) => contract_template_id,
        Err(error) => panic!("Failed to add contract: {error:?}"),
    };

    // Verify contract was added
    read_state(|state| {
        let contract_template = state
            .get_model()
            .get_contract_templates_storage()
            .get_contract_template(&contract_template_id)
            .unwrap();
        assert_eq!(contract_template.definition.name, contract_def.name);
    });

    ht_last_hub_event_matches!(HubEventType::ContractTemplateAdded { contract_template_id: event_contract_id }
        if event_contract_id == &contract_template_id);
}

#[test]
fn test_block_contract() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let contract_template_id = ht_add_contract(admin, contract_def, TEST_WASM.to_vec());
    assert_eq!(contract_template_id, 0);

    let contract = get_contract_template_int(contract_template_id).unwrap();
    assert!(contract.contract_template.blocked.is_none());

    // CHECK PERMISSION DENIED
    let result = block_contract_template_int(contract_template_id, "died".to_string());
    ht_result_err_matches!(result, BlockContractTemplateError::PermissionDenied);

    let result = set_access_rights_int(vec![AccessRight {
        caller: admin,
        permissions: Some(vec![
            Permission::SetAccessRights,
            Permission::BlockContractTemplate,
        ]),
        description: None,
    }]);
    assert!(result.is_ok());

    // CHECK CONTRACT NOT FOUND
    let result = block_contract_template_int(contract_template_id + 1, "died".to_string());
    ht_result_err_matches!(result, BlockContractTemplateError::ContractTemplateNotFound);

    // BLOCK CONTRACT SUCCESS
    let result = block_contract_template_int(contract_template_id, "died".to_string());
    assert!(result.is_ok());

    let contract = get_contract_template_int(contract_template_id).unwrap();
    assert!(contract.contract_template.blocked.is_some());

    ht_last_hub_event_matches!(HubEventType::ContractTemplateBlocked { contract_template_id: event_contract_id }
        if event_contract_id == &contract_template_id);
}

#[test]
fn test_retire_contract() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let contract_template_id = ht_add_contract(admin, contract_def, TEST_WASM.to_vec());
    assert_eq!(contract_template_id, 0);

    let contract = get_contract_template_int(contract_template_id).unwrap();
    assert!(contract.contract_template.retired.is_none());

    // CHECK PERMISSION DENIED
    let result = set_contract_template_retired_int(
        contract_template_id,
        Some("no longer supported".to_string()),
    );
    ht_result_err_matches!(result, SetContractTemplateRetiredError::PermissionDenied);

    let result = set_access_rights_int(vec![AccessRight {
        caller: admin,
        permissions: Some(vec![
            Permission::SetAccessRights,
            Permission::RetireContractTemplate,
        ]),
        description: None,
    }]);
    assert!(result.is_ok());

    // CHECK CONTRACT NOT FOUND
    let result = set_contract_template_retired_int(
        contract_template_id + 1,
        Some("no longer supported".to_string()),
    );
    ht_result_err_matches!(
        result,
        SetContractTemplateRetiredError::ContractTemplateNotFound
    );

    // RETIRE CONTRACT SUCCESS
    let reason = "no longer supported".to_string();
    let result = set_contract_template_retired_int(contract_template_id, Some(reason.clone()));
    assert!(result.is_ok());

    let contract = get_contract_template_int(contract_template_id).unwrap();
    let retired = contract.contract_template.retired.as_ref();
    assert!(retired.is_some());
    assert_eq!(retired.unwrap().value, reason);

    ht_last_hub_event_matches!(HubEventType::ContractTemplateRetired { contract_template_id: event_contract_id, retired: true }
        if event_contract_id == &contract_template_id);

    // UNRETIRE CONTRACT SUCCESS
    let result = set_contract_template_retired_int(contract_template_id, None);
    assert!(result.is_ok());

    let contract = get_contract_template_int(contract_template_id).unwrap();
    assert!(contract.contract_template.retired.is_none());

    ht_last_hub_event_matches!(HubEventType::ContractTemplateRetired { contract_template_id: event_contract_id, retired: false }
        if event_contract_id == &contract_template_id);
}
