use std::collections::BTreeSet;

use crate::{is_caller_has_access_right, log_info, mutate_state, read_state};
use candid::Principal;
use hub_canister_api::{
    block_contracts::*,
    types::{DeploymentId, HubEventType, Permission},
};
use ic_cdk_macros::update;

#[update]
fn block_contracts(
    Args {
        deployment_ids,
        contract_canister_ids,
        reason,
    }: Args,
) -> Response {
    block_contracts_int(deployment_ids, contract_canister_ids, reason).into()
}

pub(crate) fn block_contracts_int(
    deployment_ids: Vec<DeploymentId>,
    contract_canister_ids: Vec<Principal>,
    reason: String,
) -> Result<(), BlockContractsError> {
    if !is_caller_has_access_right(&Permission::BlockContract) {
        return Err(BlockContractsError::PermissionDenied);
    }

    let deduplicated_deployment_ids = deduplicate_deployment_ids(deployment_ids);
    let deduplicated_contract_ids = deduplicate_contract_canister_ids(contract_canister_ids);

    let new_blocked_deployment_ids = read_state(|state| {
        let model = state.get_model();
        let deployments_storage = model.get_deployments_storage();
        let blocked_contracts_storage = model.get_blocked_contracts_storage();

        deduplicated_deployment_ids
            .into_iter()
            .chain(
                deduplicated_contract_ids
                    .into_iter()
                    .filter_map(|contract_canister_id| {
                        deployments_storage
                            .get_deployment_id_by_contract_canister(&contract_canister_id)
                    }),
            )
            .collect::<BTreeSet<_>>()
            .into_iter()
            .filter(|deployment_id| deployments_storage.get_deployment(deployment_id).is_some())
            .filter(|deployment_id| {
                blocked_contracts_storage
                    .find_deployment_block(deployment_id)
                    .is_none()
            })
            .collect::<Vec<_>>()
    });

    if new_blocked_deployment_ids.is_empty() {
        return Ok(());
    }

    mutate_state(|state| {
        let env = state.get_env();
        let time = env.get_time().get_current_unix_epoch_time_millis();
        let caller = env.get_ic().get_caller();
        let blocked_deployments_count = new_blocked_deployment_ids.len() as u64;

        let model = state.get_model_mut();
        model
            .get_blocked_contracts_storage_mut()
            .add_contract_block_batch(time, reason.clone(), new_blocked_deployment_ids.clone());

        model.get_hub_events_storage_mut().add_hub_event(
            time,
            caller,
            HubEventType::ContractBlocked {
                deployment_ids_count: blocked_deployments_count,
            },
        );

        log_info!(
            env,
            "Contracts blocked by caller '{}' (count: {}, reason: {})",
            caller.to_text(),
            blocked_deployments_count,
            reason
        );

        Ok(())
    })
}

fn deduplicate_contract_canister_ids(contract_canister_ids: Vec<Principal>) -> Vec<Principal> {
    let mut seen = BTreeSet::new();

    contract_canister_ids
        .into_iter()
        .filter(|contract_canister_id| seen.insert(*contract_canister_id))
        .collect()
}

fn deduplicate_deployment_ids(deployment_ids: Vec<DeploymentId>) -> Vec<DeploymentId> {
    let mut seen = BTreeSet::new();

    deployment_ids
        .into_iter()
        .filter(|deployment_id| seen.insert(*deployment_id))
        .collect()
}
