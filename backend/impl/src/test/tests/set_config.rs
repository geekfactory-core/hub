use candid::Principal;
use hub_canister_api::{
    set_config::SetConfigError,
    types::{AccessRight, Config, HubEventType, Permission},
};
use ic_ledger_types::{AccountIdentifier, DEFAULT_SUBACCOUNT};

use crate::{
    ht_last_hub_event_matches, ht_result_err_matches, read_state,
    test::tests::{
        components::ic::ht_set_test_caller, ht_get_test_admin, ht_get_test_user, ht_init_test_hub,
    },
    updates::{
        set_access_rights::set_access_rights_int, set_config::set_config_int,
        validate_contract_certificate::parse_canister_from_url,
    },
};

#[tokio::test]
async fn test_set_config() {
    ht_init_test_hub();

    let admin = ht_get_test_admin();
    ht_set_test_caller(admin);

    let result = set_access_rights_int(vec![AccessRight {
        caller: admin,
        permissions: Some(vec![Permission::SetAccessRights, Permission::SetConfig]),
        description: None,
    }]);
    assert!(result.is_ok());

    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());

    // Check set denied
    ht_set_test_caller(ht_get_test_user());
    let result = set_config_int(config.clone());
    ht_result_err_matches!(result, SetConfigError::PermissionDenied);

    ht_set_test_caller(admin);

    // Check wrong regex
    let new_config = Config {
        contract_url_pattern: "{principal}".to_owned(),
        regex_for_contract_principal_parsing: vec![".*".to_string(), ".*{".to_string()],
        ..config
    };
    let result = set_config_int(new_config.clone());
    ht_result_err_matches!(result, SetConfigError::WrongConfig { .. });

    // Check wrong hex account
    let new_config = Config {
        regex_for_contract_principal_parsing: vec![
            "(?P<principal>[^.:/?#]+)".to_string(),
            "$(?P<principal>[^.:/?#]+).*".to_string(),
        ],
        deployment_fallback_account_hex: "not_a_hex".to_string(),
        ..new_config
    };
    let result = set_config_int(new_config.clone());
    ht_result_err_matches!(result, SetConfigError::WrongConfig { .. });

    // Check ok
    let account_hex =
        AccountIdentifier::new(&Principal::management_canister(), &DEFAULT_SUBACCOUNT).to_hex();

    let new_config = Config {
        deployment_fallback_account_hex: account_hex.clone(),
        ..new_config
    };
    let result = set_config_int(new_config.clone());
    assert!(result.is_ok());
    read_state(|state| {
        assert_eq!(
            state
                .get_model()
                .get_config_storage()
                .get_config()
                .deployment_fallback_account_hex
                .as_bytes(),
            account_hex.as_bytes()
        )
    });
    ht_last_hub_event_matches!(HubEventType::ConfigSet { config: event_config }
        if event_config.as_ref() == &new_config);
}

#[tokio::test]
async fn test_parse_principal() {
    ht_init_test_hub();

    let admin = ht_get_test_admin();
    ht_set_test_caller(admin);

    let result = set_access_rights_int(vec![AccessRight {
        caller: admin,
        permissions: Some(vec![Permission::SetAccessRights, Permission::SetConfig]),
        description: None,
    }]);
    assert!(result.is_ok());

    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let new_config = Config {
        contract_url_pattern: "ds".to_owned(),
        deployment_fallback_account_hex: AccountIdentifier::new(
            &Principal::management_canister(),
            &DEFAULT_SUBACCOUNT,
        )
        .to_hex(),
        regex_for_contract_principal_parsing: vec![
            "^(?P<scheme>http)://(?P<principal>[^.:/?#]+)[.]localhost[:]8080".to_string(),
            "^(?P<scheme>https)://(?P<principal>[^.:/?#]+)[.]icp0[.]io".to_string(),
        ],
        ..config
    };
    let result = set_config_int(new_config.clone());
    assert!(result.is_err());

    let new_config = Config {
        contract_url_pattern: "{principal}".to_owned(),
        ..new_config
    };
    let result = set_config_int(new_config.clone());
    assert!(result.is_err());

    let new_config = Config {
        contract_url_pattern: "http://{principal}.localhost:8080".to_owned(),
        ..new_config
    };
    let result = set_config_int(new_config.clone());
    assert!(result.is_ok());

    let principal = Principal::from_text("be2us-64aaa-aaaaa-qaabq-cai").unwrap();
    let result = parse_canister_from_url("http://be2us-64aaa-aaaaa-qaabq-cai.localhost:8080");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), principal);

    let result = parse_canister_from_url("https://be2us-64aaa-aaaaa-qaabq-cai.icp0.io");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), principal);

    let result = parse_canister_from_url("https://be2us-64aaa-aaaaa-qaabq-cai.icp1.io");
    assert!(result.is_err());

    let result = parse_canister_from_url("http://be2us-64aaa-aaaaa-qaabq-cai.icp0.io");
    assert!(result.is_err());
}
