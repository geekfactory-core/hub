use crate::is_caller_has_access_right;
use crate::model::access_rights::{check_is_access_right, AccessRights};
use crate::{get_env, log_info, mutate_state};
use hub_canister_api::types::{AccessRight, Permission};
use hub_canister_api::{set_access_rights::*, types::HubEventType};
use ic_cdk_macros::update;

#[update]
fn set_access_rights(Args { access_rights }: Args) -> Response {
    set_access_rights_int(access_rights).into()
}

pub(crate) fn set_access_rights_int(
    access_rights: Vec<AccessRight>,
) -> Result<(), SetAccessRightsError> {
    if !is_caller_has_access_right(&Permission::SetAccessRights) {
        return Err(SetAccessRightsError::PermissionDenied);
    }

    let mut new_access_rights = AccessRights::default();
    for access_right in &access_rights {
        new_access_rights.insert(
            access_right.caller,
            (
                access_right.permissions.clone(),
                access_right.description.clone(),
            ),
        );
    }

    let env = get_env();
    let caller = env.get_ic().get_caller();

    if !check_is_access_right(&new_access_rights, &caller, &Permission::SetAccessRights) {
        return Err(SetAccessRightsError::LoseControlDangerous);
    }

    log_info!(
        env,
        "New access rights received for apply: {:?}",
        new_access_rights
    );

    mutate_state(|state| {
        let model = state.get_model_mut();
        model
            .get_access_rights_storage_mut()
            .set_access_rights(new_access_rights);

        model.get_hub_events_storage_mut().add_hub_event(
            env.get_time().get_current_unix_epoch_time_millis(),
            env.get_ic().get_caller(),
            HubEventType::AccessRightsSet { access_rights },
        );
        Ok(())
    })
}
