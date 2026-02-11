use common_canister_impl::stable_structures::CBor;
use hub_canister_api::types::{Config, DeploymentId, DeploymentProcessingEvent};
use std::fmt::Debug;

use crate::model::deployments::Deployment;
use crate::state::CanisterState;
use crate::{model::deployments::DeploymentLock, mutate_state, read_state};

use super::processor::ProcessingTaskResult;

pub mod create_contract_canister_over_cmc;
pub mod create_contract_canister_over_management;
pub mod generate_contract_certificate;
pub mod install_contract_wasm;
pub mod make_contract_self_controlled;
pub mod notify_top_up_cmc;
pub mod start_deployment;
pub mod start_deployment_finalization;
pub mod start_install_wasm;
pub mod transfer_deployer_funds_to_transit_account;
pub mod transfer_top_up_funds_to_cmc;
pub mod transfer_transit_funds_to_external_service;
pub mod upload_contract_wasm;

pub(crate) fn get_deployment_data<D, S>(deployment_id: &DeploymentId, supplier: S) -> D
where
    S: FnOnce(&CanisterState, CBor<Deployment>) -> D,
{
    read_state(|state| {
        supplier(
            state,
            state
                .get_model()
                .get_deployments_storage()
                .get_deployment(deployment_id)
                .unwrap(),
        )
    })
}

pub(crate) fn get_config<D, S>(supplier: S) -> D
where
    S: FnOnce(&CanisterState, &Config) -> D,
{
    read_state(|state| supplier(state, state.get_model().get_config_storage().get_config()))
}

pub(crate) fn update_deployment(
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
    event: DeploymentProcessingEvent,
) -> Result<(), String> {
    mutate_state(|state| {
        let env = state.get_env();
        state
            .get_model_mut()
            .get_deployments_storage_mut()
            .update_deployment(
                env.get_time().get_current_unix_epoch_time_millis(),
                deployment_id,
                lock,
                event,
            )
            .map_err(to_processing_error)
    })
}

fn to_processing_error<E: Debug>(error: E) -> String {
    format!("{error:?}")
}

fn delay_processing() -> ProcessingTaskResult {
    ProcessingTaskResult::DelayTask { delay: 1 }
}
