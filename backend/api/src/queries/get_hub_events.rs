use candid::CandidType;
use common_canister_types::{ChunkDef, SortingDefinition};
use serde::Deserialize;

use crate::types::HubEvent;

pub type Args = GetHubEventsArgs;
pub type Response = GetHubEventsResponse;

#[derive(CandidType, Deserialize, Debug)]
pub enum HubEventsSortingKey {
    EventId,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetHubEventsArgs {
    pub chunk_def: ChunkDef,
    pub sorting: Option<SortingDefinition<HubEventsSortingKey>>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetHubEventsResponse {
    Ok(GetHubEventsResult),
    Err(GetHubEventsError),
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetHubEventsError {
    ChunkCountExceedsLimit { max_chunk_count: usize },
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetHubEventsResult {
    pub events: Vec<IdentifiedHubEvent>,
    pub total_count: usize,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct IdentifiedHubEvent {
    pub id: usize,
    pub event: HubEvent,
}

impl From<Result<GetHubEventsResult, GetHubEventsError>> for Response {
    fn from(result: Result<GetHubEventsResult, GetHubEventsError>) -> Self {
        match result {
            Ok(result) => GetHubEventsResponse::Ok(result),
            Err(error) => GetHubEventsResponse::Err(error),
        }
    }
}
