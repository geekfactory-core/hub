use crate::components::factory::create_environment;
use crate::model::DataModel;
use crate::state::CanisterState;
use crate::{get_env, init_state, log_info};
use ic_cdk_macros::post_upgrade;

#[post_upgrade]
fn post_upgrade() {
    init_state(CanisterState::new(create_environment(), DataModel::init()));
    log_info!(get_env(), "Hub post-upgrade completed.");
}
