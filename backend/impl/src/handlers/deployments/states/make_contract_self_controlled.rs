use crate::components::Environment;
use crate::handlers::deployments::processor::ProcessingTaskResult;
use crate::handlers::deployments::states::{
    get_deployment_data, to_processing_error, update_deployment,
};
use crate::log_info;
use crate::model::deployments::DeploymentLock;
use candid::Principal;
use hub_canister_api::types::{DeploymentId, DeploymentProcessingEvent};
use ic_cdk::management_canister::{
    canister_info, CanisterInfoArgs, CanisterSettings, UpdateSettingsArgs,
};

pub(crate) async fn process(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
) -> Result<ProcessingTaskResult, String> {
    let contract_canister = get_deployment_data(deployment_id, |_state, deployment| {
        deployment.contract_canister.unwrap()
    });

    let arg = UpdateSettingsArgs {
        canister_id: contract_canister,
        settings: CanisterSettings {
            controllers: Some(vec![contract_canister]),
            compute_allocation: None,
            memory_allocation: None,
            freezing_threshold: None,
            reserved_cycles_limit: None,
            log_visibility: None,
            wasm_memory_limit: None,
            wasm_memory_threshold: None,
            environment_variables: None,
        },
    };

    if let Err(error) = env.get_ic_management().update_settings(arg).await {
        if !is_set_contract_self_controlled(contract_canister).await {
            return Err(to_processing_error(error));
        }
    }

    log_info!(
        env,
        "Deployment '{deployment_id}': contract made self controlled."
    );

    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::ContractSelfControlledMade,
    )?;

    Ok(ProcessingTaskResult::Stop)
}

async fn is_set_contract_self_controlled(contract_canister: Principal) -> bool {
    match canister_info(&CanisterInfoArgs {
        canister_id: contract_canister,
        num_requested_changes: None,
    })
    .await
    {
        Ok(canister_info) => canister_info.controllers == vec![contract_canister],
        Err(_) => false,
    }
}
