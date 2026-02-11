use crate::read_state;
use hub_canister_api::get_config::*;
use ic_cdk_macros::query;

#[query]
fn get_config(_args: Args) -> Response {
    read_state(|state| {
        GetConfigResponse::Ok(GetConfigResult {
            config: state.get_model().get_config_storage().get_config().clone(),
        })
    })
}
