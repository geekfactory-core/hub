// extern crate core;
mod components;
mod handlers;
mod lifecycle;
mod model;
mod queries;
mod state;
#[cfg(test)]
mod test;
mod updates;

common_canister_impl::canister_state!(state::CanisterState);

fn get_env() -> std::rc::Rc<components::Environment> {
    read_state(|s| s.get_env())
}

fn is_caller_has_access_right(permission: &hub_canister_api::types::Permission) -> bool {
    read_state(|state| {
        let caller = state.get_env().get_ic().get_caller();
        state
            .get_model()
            .get_access_rights_storage()
            .is_access_right(&caller, permission)
    })
}
