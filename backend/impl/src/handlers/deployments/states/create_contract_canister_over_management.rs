use crate::components::Environment;
use crate::handlers::deployments::processor::ProcessingTaskResult;
use crate::handlers::deployments::states::{
    delay_processing, get_deployment_data, to_processing_error, update_deployment,
};
use crate::log_info;
use crate::model::deployments::DeploymentLock;
use hub_canister_api::types::{DeploymentId, DeploymentProcessingEvent};
use ic_cdk::management_canister::{
    CanisterSettings, CreateCanisterArgs, EnvironmentVariable, LogVisibility,
};

pub(crate) async fn process(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
) -> Result<ProcessingTaskResult, String> {
    let (settings, initial_cycles) = get_deployment_data(deployment_id, |state, deployment| {
        (
            state
                .get_model()
                .get_contract_templates_storage()
                .get_contract_template(&deployment.contract_template_id)
                .unwrap()
                .definition
                .contract_canister_settings
                .clone(),
            deployment.deployment_expenses.contract_initial_cycles,
        )
    });

    let arg = CreateCanisterArgs {
        settings: Some(CanisterSettings {
            controllers: Some(vec![env.get_ic().get_canister()]),
            log_visibility: Some(LogVisibility::Public),
            compute_allocation: settings.compute_allocation.map(|v| v.into()),
            memory_allocation: settings.memory_allocation.map(|v| v.into()),
            freezing_threshold: settings.freezing_threshold.map(|v| v.into()),
            reserved_cycles_limit: settings.reserved_cycles_limit.map(|v| v.into()),
            wasm_memory_limit: settings.wasm_memory_limit.map(|v| v.into()),
            wasm_memory_threshold: settings.wasm_memory_threshold.map(|v| v.into()),
            environment_variables: settings.environment_variables.as_ref().map(|vars| {
                vars.iter()
                    .map(|(name, value)| EnvironmentVariable {
                        name: name.to_owned(),
                        value: value.to_owned(),
                    })
                    .collect()
            }),
        }),
    };

    let cost = env.get_ic().get_cost_create_canister();
    let extra_cycles = initial_cycles.saturating_sub(cost);

    let canister = env
        .get_ic_management()
        .create_canister_with_extra_cycles(arg, extra_cycles)
        .await
        .map(|result| result.canister_id)
        .map_err(to_processing_error)?;

    log_info!(
        env,
        "Deployment '{deployment_id}': created contract canister via management ({:?}) with initial cycles: {}.",
        canister.to_text(),
        initial_cycles
    );

    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::ContractCanisterOverManagementCreated { settings, canister },
    )?;

    Ok(delay_processing())
}
