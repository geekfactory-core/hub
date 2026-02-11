use crate::handlers::deployments::states::get_config;
use crate::{get_env, read_state};
use crate::{handlers::deployments::build_deployment_information, model::deployments::Deployment};
use candid::Principal;
use common_canister_impl::stable_structures::CBor;
use common_canister_types::{SortingDefinition, SortingOrder};
use common_contract_api::ContractTemplateId;
use hub_canister_api::{get_deployments::*, types::DeploymentId};
use ic_cdk_macros::query;

type DeploymentsChunkResult = (Vec<(DeploymentId, CBor<Deployment>)>, usize);

#[query]
fn get_deployments(args: Args) -> Response {
    get_deployments_int(args).into()
}

fn get_deployments_int(
    Args {
        chunk_def,
        selector,
        sorting,
    }: Args,
) -> Result<GetDeploymentsResult, GetDeploymentsError> {
    let start = chunk_def.start;
    let count = chunk_def.count;
    let descending = matches!(
        sorting,
        Some(SortingDefinition {
            order: SortingOrder::Descending,
            ..
        })
    );

    let max_chunk_count = get_config(|_, config| config.max_deployments_per_chunk);
    if count > max_chunk_count {
        return Err(GetDeploymentsError::ChunkCountExceedsLimit { max_chunk_count });
    }

    let (deployments, total_count) = match selector {
        DeploymentsSelector::All => get_all_deployments(start, count, descending),
        DeploymentsSelector::ByContractTemplate {
            contract_template_id,
        } => {
            get_deployments_by_contract_template_id(start, count, descending, contract_template_id)
        }
        DeploymentsSelector::ByDeployer {
            deployer,
            contract_template_id,
        } => get_deployments_by_deployer(start, count, descending, deployer, contract_template_id),
    };

    let env = get_env();
    let deployments = deployments
        .into_iter()
        .map(|(deployment_id, deployment)| {
            build_deployment_information(env.as_ref(), &deployment_id, deployment)
        })
        .collect();

    Ok(GetDeploymentsResult {
        deployments,
        total_count,
    })
}

fn get_all_deployments(start: usize, count: usize, descending: bool) -> DeploymentsChunkResult {
    read_state(|state| {
        let storage = state.get_model().get_deployments_storage();

        let total_count = storage.get_all_deployments_count() as usize;
        let mut deployments = Vec::with_capacity(count);

        for index in start..(start + count) {
            let deployment_id = if descending {
                (total_count - index - 1) as u64
            } else {
                index as u64
            };

            match storage.get_deployment(&deployment_id) {
                Some(deployment) => deployments.push((deployment_id, deployment)),
                None => break,
            }
        }

        (deployments, total_count)
    })
}

fn get_deployments_by_contract_template_id(
    start: usize,
    count: usize,
    descending: bool,
    contract_template_id: ContractTemplateId,
) -> DeploymentsChunkResult {
    read_state(|state| {
        let storage = state.get_model().get_deployments_storage();

        let mut deployments = Vec::with_capacity(count);
        let mut total_count = 0;

        let receiver = |deployment_id: DeploymentId| {
            total_count += 1;

            if start < total_count && deployments.len() < count {
                deployments.push((
                    deployment_id,
                    storage.get_deployment(&deployment_id).unwrap(),
                ));
            }
            true
        };

        storage.iterate_by_contract_template(contract_template_id, descending, receiver);

        (deployments, total_count)
    })
}

fn get_deployments_by_deployer(
    start: usize,
    count: usize,
    descending: bool,
    deployer: Principal,
    contract_template_id: Option<ContractTemplateId>,
) -> DeploymentsChunkResult {
    read_state(|state| {
        let storage = state.get_model().get_deployments_storage();

        let mut deployments = Vec::with_capacity(count);
        let mut total_count = 0;

        let receiver = |deployment_id: DeploymentId| {
            total_count += 1;

            if start < total_count && deployments.len() < count {
                deployments.push((
                    deployment_id,
                    storage.get_deployment(&deployment_id).unwrap(),
                ));
            }
            true
        };

        if let Some(contract_template_id) = contract_template_id {
            storage.iterate_by_deployer_and_contract_template(
                deployer,
                contract_template_id,
                descending,
                receiver,
            );
        } else {
            storage.iterate_by_deployer(deployer, descending, receiver);
        }

        (deployments, total_count)
    })
}
