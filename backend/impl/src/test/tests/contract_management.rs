use common_contract_api::get_wasm_hash;
use hub_canister_api::{
    add_contract_template::{AddContractTemplateError, AddContractTemplateResult},
    block_contract_template::BlockContractTemplateError,
    block_contracts::BlockContractsError,
    set_contract_template_retired::SetContractTemplateRetiredError,
    set_upload_wasm_grant::SetUploadWasmGrantError,
    types::{
        AccessRight, Config, ContractTemplateDefinition, HubEventType, Permission, UploadWasmGrant,
    },
    upload_wasm_chunk::UploadWasmChunkError,
};

use crate::{
    ht_last_hub_event_matches, ht_result_err_matches,
    queries::{
        get_contract_block_status::get_contract_block_status_int,
        get_contract_template::get_contract_template_int,
    },
    read_state,
    test::tests::{
        components::ic::ht_set_test_caller,
        components::time::ht_set_test_time,
        drivers::{
            contract::ht_add_contract,
            deployment::{get_deployment_lock_expiration, ht_drive_to_deploying, DeploymentConfig},
        },
        ht_get_test_admin, ht_get_test_user, ht_init_test_hub, ht_set_initial_config,
        support::fixtures::{ht_get_face_contract_def, TEST_CONTRACT_INITIAL_CYCLES, TEST_WASM},
    },
    updates::{
        add_contract_template::add_contract_template_int,
        block_contract_template::block_contract_template_int, block_contracts::block_contracts_int,
        process_deployment::process_deployment_int, set_access_rights::set_access_rights_int,
        set_config::set_config_int,
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

#[tokio::test]
async fn test_block_contracts() {
    let admin = ht_get_test_admin();
    let deployer = ht_get_test_user();

    let contract_template_id =
        ht_add_contract(admin, ht_get_face_contract_def(), TEST_WASM.to_vec());
    let first_deployment = ht_drive_to_deploying(
        admin,
        deployer,
        contract_template_id,
        &DeploymentConfig::default(),
        TEST_CONTRACT_INITIAL_CYCLES,
        None,
    )
    .await;
    let first_contract_canister =
        drive_deployment_until_contract_canister(deployer, first_deployment.deployment_id).await;

    let unknown_contract_canister = candid::Principal::from_text("2vxsx-fae").unwrap();

    let result = block_contracts_int(
        vec![],
        vec![first_contract_canister, first_contract_canister],
        "policy-1".to_string(),
    );
    ht_result_err_matches!(result, BlockContractsError::PermissionDenied);

    ht_set_test_caller(admin);
    let result = set_access_rights_int(vec![AccessRight {
        caller: admin,
        permissions: Some(vec![
            Permission::SetAccessRights,
            Permission::SetConfig,
            Permission::BlockContract,
        ]),
        description: None,
    }]);
    assert!(result.is_ok());

    let result = block_contracts_int(
        vec![
            first_deployment.deployment_id,
            first_deployment.deployment_id,
        ],
        vec![
            first_contract_canister,
            first_contract_canister,
            unknown_contract_canister,
        ],
        "policy-1".to_string(),
    );
    assert!(result.is_ok());

    read_state(|state| {
        let storage = state.get_model().get_blocked_contracts_storage();
        assert_eq!(storage.get_contract_blocks_len(), 1);

        let batch = storage.get_contract_block_batch(0).unwrap();
        assert_eq!(batch.reason, "policy-1");
        assert!(batch.blocked_at > 0);
        assert_eq!(batch.deployment_ids, vec![first_deployment.deployment_id]);
        assert_eq!(
            storage
                .find_deployment_block(&first_deployment.deployment_id)
                .map(|blocked| blocked.value),
            Some("policy-1".to_string())
        );
        assert_eq!(
            get_contract_block_status_int(hub_canister_api::get_contract_block_status::ContractBlockFilter::ByContractCanisterId {
                canister_id: first_contract_canister,
            })
            .map(|blocked| blocked.value),
            Some("policy-1".to_string())
        );
    });

    ht_last_hub_event_matches!(HubEventType::ContractBlocked { deployment_ids_count }
        if deployment_ids_count == &1);

    let result = block_contracts_int(
        vec![first_deployment.deployment_id],
        vec![first_contract_canister, unknown_contract_canister],
        "policy-2".to_string(),
    );
    assert!(result.is_ok());

    read_state(|state| {
        let storage = state.get_model().get_blocked_contracts_storage();
        assert_eq!(storage.get_contract_blocks_len(), 1);

        assert_eq!(
            storage
                .find_deployment_block(&first_deployment.deployment_id)
                .map(|blocked| blocked.value),
            Some("policy-1".to_string())
        );
        assert_eq!(
            get_contract_block_status_int(hub_canister_api::get_contract_block_status::ContractBlockFilter::ByContractCanisterId {
                canister_id: unknown_contract_canister,
            }),
            None
        );
    });

    let result = block_contracts_int(
        vec![first_deployment.deployment_id],
        vec![first_contract_canister, unknown_contract_canister],
        "policy-3".to_string(),
    );
    assert!(result.is_ok());

    read_state(|state| {
        let storage = state.get_model().get_blocked_contracts_storage();
        assert_eq!(storage.get_contract_blocks_len(), 1);
        assert_eq!(
            storage
                .find_deployment_block(&first_deployment.deployment_id)
                .map(|blocked| blocked.value),
            Some("policy-1".to_string())
        );
        assert_eq!(
            get_contract_block_status_int(
                hub_canister_api::get_contract_block_status::ContractBlockFilter::ByDeploymentId {
                    deployment_id: first_deployment.deployment_id,
                }
            )
            .map(|blocked| blocked.value),
            Some("policy-1".to_string())
        );
    });
}

async fn drive_deployment_until_contract_canister(
    deployer: candid::Principal,
    deployment_id: u64,
) -> candid::Principal {
    loop {
        if let Some(contract_canister) = read_state(|state| {
            state
                .get_model()
                .get_deployments_storage()
                .get_deployment(&deployment_id)
                .unwrap()
                .contract_canister
        }) {
            return contract_canister;
        }

        ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
        ht_set_test_caller(deployer);
        assert!(process_deployment_int(deployment_id).await.is_ok());
    }
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
