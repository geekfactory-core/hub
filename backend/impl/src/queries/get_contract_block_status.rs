use hub_canister_api::get_contract_block_status::*;
use ic_cdk_macros::query;

use crate::read_state;

#[query]
fn get_contract_block_status(Args { filter }: Args) -> Response {
    get_contract_block_status_int(filter).into()
}

pub(crate) fn get_contract_block_status_int(
    filter: ContractBlockFilter,
) -> Result<GetContractBlockStatusResult, GetContractBlockStatusError> {
    read_state(|state| {
        let model = state.get_model();
        let blocked_contracts_storage = model.get_blocked_contracts_storage();

        match filter {
            ContractBlockFilter::ByDeploymentId { deployment_id } => {
                if model
                    .get_deployments_storage()
                    .get_deployment(&deployment_id)
                    .is_none()
                {
                    return Err(GetContractBlockStatusError::DeploymentNotFound);
                }

                Ok(GetContractBlockStatusResult {
                    blocked: blocked_contracts_storage.find_deployment_block(&deployment_id),
                })
            }
            ContractBlockFilter::ByContractCanisterId { canister_id } => {
                let deployment_id = model
                    .get_deployments_storage()
                    .get_deployment_id_by_contract_canister(&canister_id)
                    .ok_or(GetContractBlockStatusError::ContractCanisterNotFound)?;

                Ok(GetContractBlockStatusResult {
                    blocked: blocked_contracts_storage.find_deployment_block(&deployment_id),
                })
            }
        }
    })
}
