use common_canister_types::{SortingDefinition, SortingOrder};
use hub_canister_api::get_deployment_events::*;
use ic_cdk_macros::query;

use crate::read_state;

#[query]
fn get_deployment_events(args: Args) -> Response {
    get_deployment_events_int(args).into()
}

fn get_deployment_events_int(
    Args {
        deployment_id,
        chunk_def,
        sorting,
    }: Args,
) -> Result<GetDeploymentEventsResult, GetDeploymentEventsError> {
    let start = chunk_def.start;
    let count = chunk_def.count;
    let descending = matches!(
        sorting,
        Some(SortingDefinition {
            order: SortingOrder::Descending,
            ..
        })
    );

    read_state(|state| {
        let max_chunk_count = state
            .get_model()
            .get_config_storage()
            .get_config()
            .max_deployment_events_per_chunk;
        if count > max_chunk_count {
            return Err(GetDeploymentEventsError::ChunkCountExceedsLimit { max_chunk_count });
        }

        let storage = state.get_model().get_deployments_storage();

        if storage.get_deployment(&deployment_id).is_none() {
            return Err(GetDeploymentEventsError::DeploymentNotFound);
        }

        let mut events = Vec::with_capacity(count);
        let mut total_count = 0;

        let receiver = |event_id| {
            total_count += 1;

            if start < total_count && events.len() < count {
                let event = storage.get_event(event_id).unwrap();
                events.push(DeploymentProcessingIdentifiedEvent {
                    id: event_id,
                    time: event.timestamp,
                    event: event.value.to_owned(),
                });
            }

            true
        };

        storage.iterate_events(deployment_id, descending, receiver);

        Ok(GetDeploymentEventsResult {
            events,
            total_count,
        })
    })
}
