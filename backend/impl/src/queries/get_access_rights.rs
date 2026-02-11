use crate::read_state;
use hub_canister_api::{get_access_rights::*, types::AccessRight};
use ic_cdk_macros::query;

#[query]
fn get_access_rights(_args: Args) -> Response {
    read_state(|state| {
        GetAccessRightsResponse::Ok(GetAccessRightsResult {
            access_rights: state
                .get_model()
                .get_access_rights_storage()
                .get_access_rights()
                .iter()
                .map(|(caller, (permissions, description))| AccessRight {
                    caller: *caller,
                    permissions: permissions.clone(),
                    description: description.clone(),
                })
                .collect(),
        })
    })
}
