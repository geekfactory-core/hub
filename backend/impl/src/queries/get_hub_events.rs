use common_canister_types::SortingOrder;
use hub_canister_api::get_hub_events::*;
use ic_cdk_macros::query;

use crate::read_state;

#[query]
fn get_hub_events(args: Args) -> Response {
    get_hub_events_int(args).into()
}

fn get_hub_events_int(
    Args { chunk_def, sorting }: Args,
) -> Result<GetHubEventsResult, GetHubEventsError> {
    let start = chunk_def.start;
    let count = chunk_def.count;
    let descending = sorting.is_none_or(|s| s.order == SortingOrder::Descending);

    read_state(|state| {
        let model = state.get_model();

        let max_chunk_count = model
            .get_config_storage()
            .get_config()
            .max_hub_events_per_chunk;
        if count > max_chunk_count {
            return Err(GetHubEventsError::ChunkCountExceedsLimit { max_chunk_count });
        }

        let total_count = model.get_hub_events_storage().get_hub_events_len() as usize;
        let mut events = Vec::with_capacity(count);

        for index in start..(start + count) {
            let index = if descending {
                total_count - index - 1
            } else {
                index
            };

            match model.get_hub_events_storage().get_hub_event(index as u64) {
                Some(event) => events.push(IdentifiedHubEvent {
                    id: index,
                    event: event.to_owned(),
                }),
                None => break,
            }
        }

        Ok(GetHubEventsResult {
            total_count,
            events,
        })
    })
}
