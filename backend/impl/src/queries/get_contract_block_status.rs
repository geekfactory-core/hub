use common_canister_types::Timestamped;
use hub_canister_api::get_contract_block_status::*;
use ic_cdk_macros::query;

use crate::read_state;

#[query]
fn get_contract_block_status(Args { filter }: Args) -> Response {
    GetContractBlockStatusResult {
        blocked: get_contract_block_status_int(filter),
    }
}

pub(crate) fn get_contract_block_status_int(
    filter: ContractBlockFilter,
) -> Option<Timestamped<String>> {
    read_state(|state| {
        let model = state.get_model();
        let blocked_contracts_storage = model.get_blocked_contracts_storage();
        match filter {
            ContractBlockFilter::ByDeploymentId { deployment_id } => {
                blocked_contracts_storage.find_deployment_block(&deployment_id)
            }
            ContractBlockFilter::ByContractCanisterId { canister_id } => model
                .get_deployments_storage()
                .get_deployment_id_by_contract_canister(&canister_id)
                .and_then(|deployment_id| {
                    blocked_contracts_storage.find_deployment_block(&deployment_id)
                }),
        }
    })
}
