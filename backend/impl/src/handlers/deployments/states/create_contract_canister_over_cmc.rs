use crate::components::Environment;
use crate::handlers::deployments::processor::ProcessingTaskResult;
use crate::handlers::deployments::states::{
    delay_processing, get_config, get_deployment_data, update_deployment,
};
use crate::log_info;
use crate::model::deployments::DeploymentLock;
use common_canister_impl::components::cmc::api::{
    CreateCanisterArg, CreateCanisterError, SubnetFilter, SubnetSelection,
};
use common_canister_impl::components::cmc::interface::CallWrapperError;
use hub_canister_api::types::{
    CreateContractCanisterStrategy, DeploymentId, DeploymentProcessingEvent,
};
use ic_cdk::management_canister::{CanisterSettings, EnvironmentVariable, LogVisibility};

pub(crate) async fn process(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
) -> Result<ProcessingTaskResult, String> {
    let strategy = get_config(|_, config| config.contract_canister_creation_strategy.clone());

    let cmc_canister = match strategy {
        CreateContractCanisterStrategy::OverCMC { cmc_canister } => cmc_canister,
        CreateContractCanisterStrategy::OverManagementCanister => {
            return use_management_canister_creating(
                env,
                deployment_id,
                lock,
                "strategy switched to management".to_owned(),
            );
        }
    };

    let (settings, subnet_type, initial_cycles) =
        get_deployment_data(deployment_id, |state, deployment| {
            (
                state
                    .get_model()
                    .get_contract_templates_storage()
                    .get_contract_template(&deployment.contract_template_id)
                    .unwrap()
                    .definition
                    .contract_canister_settings
                    .clone(),
                deployment.subnet_type.clone(),
                deployment.deployment_expenses.contract_initial_cycles,
            )
        });

    let arg = CreateCanisterArg {
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
        subnet_selection: Some(SubnetSelection::Filter(SubnetFilter { subnet_type })),
    };

    let canister = match env
        .get_cmc()
        .create_canister(cmc_canister, arg, initial_cycles)
        .await
    {
        Ok(canister) => canister,
        Err(error) => match error {
            CallWrapperError::CallError { reason } => return Err(reason),
            CallWrapperError::WrappedError {
                error:
                    CreateCanisterError::Refunded {
                        create_error,
                        refund_amount,
                    },
            } => {
                return use_management_canister_creating(
                    env,
                    deployment_id,
                    lock,
                    format!("{refund_amount} cycles refunded due to {create_error}"),
                );
            }
        },
    };

    log_info!(
        env,
        "Deployment '{deployment_id}': created contract canister via CMC ({:?}) with initial cycles: {}.",
        canister.to_text(),
        initial_cycles
    );

    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::ContractCanisterOverCMCCreated { settings, canister },
    )?;

    Ok(delay_processing())
}

fn use_management_canister_creating(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
    reason: String,
) -> Result<ProcessingTaskResult, String> {
    log_info!(
        env,
        "Deployment '{deployment_id}': using management canister to create contract canister ({reason})."
    );

    update_deployment(
        deployment_id,
        lock,
        DeploymentProcessingEvent::UseManagementCanisterCreation { reason },
    )?;
    Ok(ProcessingTaskResult::Continue)
}
