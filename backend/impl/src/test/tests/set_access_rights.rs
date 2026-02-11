use hub_canister_api::{
    set_access_rights::SetAccessRightsError,
    types::{AccessRight, HubEventType, Permission},
};

use crate::{
    ht_last_hub_event_matches, ht_result_err_matches, read_state,
    test::tests::{
        components::ic::ht_set_test_caller, ht_get_test_admin, ht_get_test_user, ht_init_test_hub,
    },
    updates::set_access_rights::set_access_rights_int,
};

#[tokio::test]
async fn test_set_access_rights() {
    ht_init_test_hub();

    let admin = ht_get_test_admin();
    ht_set_test_caller(admin);

    let result = set_access_rights_int(vec![]);
    assert!(result.is_ok());
    read_state(|state| {
        assert!(state
            .get_model()
            .get_access_rights_storage()
            .get_access_rights()
            .is_empty())
    });

    let result = set_access_rights_int(vec![AccessRight {
        caller: ht_get_test_user(),
        permissions: None,
        description: None,
    }]);
    ht_result_err_matches!(result, SetAccessRightsError::LoseControlDangerous);

    let result = set_access_rights_int(vec![AccessRight {
        caller: admin,
        permissions: None,
        description: None,
    }]);
    assert!(result.is_ok());

    read_state(|state| {
        let ar = state.get_model().get_access_rights_storage();
        assert!(ar.is_access_right(&admin, &Permission::SetAccessRights));
        assert!(ar.is_access_right(&admin, &Permission::BlockContractTemplate));
    });

    let access_rights = vec![AccessRight {
        caller: admin,
        permissions: Some(vec![Permission::SetAccessRights]),
        description: None,
    }];
    let result = set_access_rights_int(access_rights.clone());
    assert!(result.is_ok());

    read_state(|state| {
        let ar = state.get_model().get_access_rights_storage();
        assert!(ar.is_access_right(&admin, &Permission::SetAccessRights));
        assert!(!ar.is_access_right(&admin, &Permission::BlockContractTemplate));
    });
    ht_last_hub_event_matches!(HubEventType::AccessRightsSet { access_rights: event_access_rights }
        if event_access_rights == &access_rights);

    // Check set denied
    ht_set_test_caller(ht_get_test_user());
    let result = set_access_rights_int(vec![AccessRight {
        caller: ht_get_test_user(),
        permissions: None,
        description: None,
    }]);
    ht_result_err_matches!(result, SetAccessRightsError::PermissionDenied);
}
