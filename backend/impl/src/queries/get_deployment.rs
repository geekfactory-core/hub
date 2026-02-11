use hub_canister_api::get_deployment::*;
use ic_cdk_macros::query;

use crate::{
    handlers::deployments::{
        build_deployment_information, build_deployment_information_with_load,
        find_active_deployment,
    },
    read_state,
    updates::validate_contract_certificate::parse_canister_from_url,
};

#[query]
fn get_deployment(Args { filter }: Args) -> Response {
    get_deployment_int(filter).into()
}

pub(crate) fn get_deployment_int(
    filter: DeploymentFilter,
) -> Result<GetDeploymentResult, GetDeploymentError> {
    match filter {
        DeploymentFilter::ByDeploymentId { deployment_id } => {
            build_deployment_information_with_load(&deployment_id)
                .map(|deployment| GetDeploymentResult { deployment })
        }
        DeploymentFilter::ByContractCanisterId { canister_id } => read_state(|state| {
            state
                .get_model()
                .get_deployments_storage()
                .get_deployment_id_by_contract_canister(&canister_id)
                .and_then(|deployment_id| {
                    build_deployment_information_with_load(&deployment_id)
                        .map(|deployment| GetDeploymentResult { deployment })
                })
        }),
        DeploymentFilter::ByContractCanisterUrl { canister_url } => {
            let parse_url_result = parse_canister_from_url(&canister_url);
            let canister_id =
                parse_url_result.map_err(|_| GetDeploymentError::DeploymentNotFound)?;
            read_state(|state| {
                let deployment_storage = state.get_model().get_deployments_storage();
                deployment_storage
                    .get_deployment_id_by_contract_canister(&canister_id)
                    .and_then(|deployment_id| {
                        build_deployment_information_with_load(&deployment_id)
                            .map(|deployment| GetDeploymentResult { deployment })
                    })
            })
        }
        DeploymentFilter::Active { deployer } => {
            find_active_deployment(&deployer, build_deployment_information)
                .map(|deployment| GetDeploymentResult { deployment })
        }
    }
    .ok_or(GetDeploymentError::DeploymentNotFound)
}
