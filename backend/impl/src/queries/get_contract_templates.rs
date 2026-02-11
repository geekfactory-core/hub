use std::cmp::Ordering;

use crate::{
    handlers::{deployments::states::get_config, templates::build_contract_template_information},
    model::templates::ContractTemplateModel,
    read_state,
};
use common_canister_impl::stable_structures::CBor;
use common_canister_types::{SortingDefinition, SortingOrder};
use common_contract_api::ContractTemplateId;
use hub_canister_api::get_contract_templates::*;
use ic_cdk_macros::query;

const MIN_FILTER_TEXT_LENGTH: usize = 3;
const MAX_FILTER_TEXT_LENGTH: usize = 30;

#[query]
fn get_contract_templates(args: Args) -> Response {
    get_contract_templates_int(args).into()
}

fn get_contract_templates_int(
    Args {
        chunk_def,
        filter,
        sorting,
    }: Args,
) -> Result<GetContractTemplatesResult, GetContractTemplatesError> {
    let start = chunk_def.start;
    let count = chunk_def.count;

    let max_chunk_count = get_config(|_, config| config.max_contract_templates_per_chunk);
    if count > max_chunk_count {
        return Err(GetContractTemplatesError::ChunkCountExceedsLimit { max_chunk_count });
    }

    let sorting = sorting.unwrap_or(SortingDefinition {
        key: ContractTemplatesSortingKey::ContractTemplateId,
        order: SortingOrder::Ascending,
    });

    read_state(|state| {
        let mut contract_templates = match filter.as_ref() {
            Some(filter) => state
                .get_model()
                .get_contract_templates_storage()
                .get_iter()
                .map(|entry| (*entry.key(), entry.value()))
                .filter(create_iter_filter(filter)?)
                .collect::<Vec<_>>(),
            None => state
                .get_model()
                .get_contract_templates_storage()
                .get_iter()
                .map(|entry| (*entry.key(), entry.value()))
                .collect::<Vec<_>>(),
        };

        contract_templates.sort_by(create_sorting(&sorting));

        let total_count = contract_templates.len();

        let contract_templates = contract_templates
            .iter()
            .skip(start)
            .take(count)
            .map(|(id, model)| build_contract_template_information(id, model))
            .collect();

        Ok(GetContractTemplatesResult {
            total_count,
            contract_templates,
        })
    })
}

#[allow(clippy::type_complexity)]
fn create_iter_filter(
    filter: &ContractTemplatesFilter,
) -> Result<
    Box<dyn FnMut(&(ContractTemplateId, CBor<ContractTemplateModel>)) -> bool + '_>,
    GetContractTemplatesError,
> {
    let mut filters: Vec<Box<dyn Fn(&ContractTemplateModel) -> bool>> = Vec::new();
    if let Some(text) = filter.filter.as_ref() {
        let text_len = text.len();
        if text_len < MIN_FILTER_TEXT_LENGTH {
            return Err(GetContractTemplatesError::FilterTextTooShort);
        }
        if text_len > MAX_FILTER_TEXT_LENGTH {
            return Err(GetContractTemplatesError::FilterTextTooLong);
        }

        let text = text.to_lowercase();
        filters.push(Box::new(move |contract: &ContractTemplateModel| {
            let def = &contract.definition;
            def.name.to_lowercase().contains(&text)
                || def.short_description.to_lowercase().contains(&text)
                || def
                    .long_description
                    .as_ref()
                    .map(|desc| desc.to_lowercase().contains(&text))
                    .unwrap_or(false)
        }));
    }

    if let Some(blocked) = filter.blocked {
        filters.push(Box::new(move |contract: &ContractTemplateModel| {
            contract.blocked.is_some() == blocked
        }));
    }

    Ok(Box::new(move |(_, contract)| {
        filters.iter().all(|f| f(contract))
    }))
}

pub type SortingFn = Box<
    dyn FnMut(
        &(ContractTemplateId, CBor<ContractTemplateModel>),
        &(ContractTemplateId, CBor<ContractTemplateModel>),
    ) -> Ordering,
>;

fn create_sorting(sorting_def: &SortingDefinition<ContractTemplatesSortingKey>) -> SortingFn {
    match sorting_def.key {
        ContractTemplatesSortingKey::ContractTemplateId => {
            if let SortingOrder::Ascending = sorting_def.order {
                Box::new(|(id1, _), (id2, _)| id1.cmp(id2))
            } else {
                Box::new(|(id1, _), (id2, _)| id2.cmp(id1))
            }
        }
        ContractTemplatesSortingKey::Registered => {
            if let SortingOrder::Ascending = sorting_def.order {
                Box::new(|(_, contract1), (_, contract2)| {
                    contract1.registered.cmp(&contract2.registered)
                })
            } else {
                Box::new(|(_, contract1), (_, contract2)| {
                    contract2.registered.cmp(&contract1.registered)
                })
            }
        }
        ContractTemplatesSortingKey::DeploymentsCount => {
            if let SortingOrder::Ascending = sorting_def.order {
                Box::new(|(_, contract1), (_, contract2)| {
                    contract1
                        .deployments_count
                        .cmp(&contract2.deployments_count)
                })
            } else {
                Box::new(|(_, contract1), (_, contract2)| {
                    contract2
                        .deployments_count
                        .cmp(&contract1.deployments_count)
                })
            }
        }
    }
}
