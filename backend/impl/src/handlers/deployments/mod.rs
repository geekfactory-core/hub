use crate::read_state;
use crate::{components::Environment, model::deployments::Deployment};
use candid::Principal;
use common_canister_impl::stable_structures::CBor;
use hub_canister_api::types::{
    DeploymentId, DeploymentInformation, DeploymentState, FinalizeDeploymentState,
};
use processor::need_process_deployment;

pub mod expenses_calculator;
pub mod factory;
pub mod processor;
pub mod states;

pub(crate) fn build_deployment_information(
    env: &Environment,
    deployment_id: &DeploymentId,
    deployment: CBor<Deployment>,
) -> DeploymentInformation {
    let need_processing = need_process_deployment(env, deployment_id);

    DeploymentInformation {
        deployment_id: *deployment_id,
        deployer: deployment.deployer,
        created: deployment.created,
        contract_template_id: deployment.contract_template_id,
        deployment_expenses: deployment.deployment_expenses.clone(),
        expenses_amount: deployment.expenses_amount,
        approved_account: deployment.approved_account.clone(),
        subnet_type: deployment.subnet_type.clone(),
        state: deployment.state.value.clone(),
        need_processing,
        processing_error: deployment.processing_error.clone(),
        contract_canister: deployment.contract_canister,
        lock: deployment
            .lock
            .as_ref()
            .map(|l| env.get_time().get_delayed_time_millis(l.expiration)),
    }
}

pub(crate) fn build_deployment_information_with_load(
    deployment_id: &DeploymentId,
) -> Option<DeploymentInformation> {
    read_state(|state| {
        state
            .get_model()
            .get_deployments_storage()
            .get_deployment(deployment_id)
            .map(|deployment| {
                build_deployment_information(&state.get_env(), deployment_id, deployment)
            })
    })
}

pub(crate) fn find_active_deployment<F, T>(deployer: &Principal, receiver: F) -> Option<T>
where
    F: Fn(&Environment, &DeploymentId, CBor<Deployment>) -> T,
{
    read_state(|state| {
        let mut last_deployment_id = None;

        let storage = state.get_model().get_deployments_storage();
        storage.iterate_by_deployer(*deployer, true, |deployment_id| {
            last_deployment_id = Some(deployment_id);
            false
        });

        last_deployment_id.and_then(|last_id| {
            storage.get_deployment(&last_id).and_then(|deployment| {
                if matches!(
                    deployment.state.value,
                    DeploymentState::FinalizeDeployment {
                        sub_state: FinalizeDeploymentState::Finalized,
                        ..
                    }
                ) {
                    None
                } else {
                    Some(receiver(&state.get_env(), &last_id, deployment))
                }
            })
        })
    })
}
