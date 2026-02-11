use hub_canister_api::types::{DeploymentId, DeploymentState, FinalizeDeploymentState};

use crate::handlers::deployments::states::{start_deployment, upload_contract_wasm};
use crate::model::deployments::DeploymentLock;
use crate::processor_toolkit;
use crate::{components::Environment, read_state};

use super::processor::ProcessorToolkit;
use super::states::{
    create_contract_canister_over_cmc, create_contract_canister_over_management,
    generate_contract_certificate, install_contract_wasm, make_contract_self_controlled,
    notify_top_up_cmc, start_deployment_finalization, start_install_wasm,
    transfer_deployer_funds_to_transit_account, transfer_top_up_funds_to_cmc,
    transfer_transit_funds_to_external_service,
};

pub(crate) fn get_processor<'a>(
    _: &Environment,
    deployment_id: &DeploymentId,
) -> ProcessorToolkit<'a> {
    let deployment = read_state(|state| {
        state
            .get_model()
            .get_deployments_storage()
            .get_deployment(deployment_id)
    })?;

    match &deployment.state.value {
        DeploymentState::StartDeployment => {
            processor_toolkit!(start_deployment)
        }
        DeploymentState::TransferDeployerFundsToTransitAccount => {
            processor_toolkit!(transfer_deployer_funds_to_transit_account)
        }
        DeploymentState::TransferTopUpFundsToCMC => {
            processor_toolkit!(transfer_top_up_funds_to_cmc)
        }
        DeploymentState::NotifyCMCTopUp { .. } => processor_toolkit!(notify_top_up_cmc),
        DeploymentState::CreateContractCanisterOverCMC => {
            processor_toolkit!(create_contract_canister_over_cmc)
        }
        DeploymentState::CreateContractCanisterOverManagement => {
            processor_toolkit!(create_contract_canister_over_management)
        }
        DeploymentState::GenerateContractCertificate => {
            processor_toolkit!(generate_contract_certificate)
        }
        DeploymentState::WaitingReceiveContractCertificate => None,
        DeploymentState::StartInstallContractWasm { .. } => processor_toolkit!(start_install_wasm),
        DeploymentState::UploadContractWasm { .. } => processor_toolkit!(upload_contract_wasm),
        DeploymentState::InstallContractWasm { .. } => processor_toolkit!(install_contract_wasm),
        DeploymentState::MakeContractSelfControlled => {
            processor_toolkit!(make_contract_self_controlled)
        }
        DeploymentState::FinalizeDeployment { sub_state, .. } => match sub_state {
            FinalizeDeploymentState::StartDeploymentFinalization => {
                processor_toolkit!(start_deployment_finalization)
            }
            FinalizeDeploymentState::TransferTransitFundsToExternalService => {
                processor_toolkit!(transfer_transit_funds_to_external_service)
            }
            FinalizeDeploymentState::Finalized => None,
        },
    }
}
