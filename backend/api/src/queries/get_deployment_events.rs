use candid::CandidType;
use common_canister_types::{ChunkDef, SortingDefinition, TimestampMillis};
use serde::Deserialize;

use crate::types::{DeploymentEventId, DeploymentId, DeploymentProcessingEvent};

pub type Args = GetDeploymentEventsArgs;
pub type Response = GetDeploymentEventsResponse;

#[derive(CandidType, Deserialize, Debug)]
pub enum DeploymentEventsSortingKey {
    EventId,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetDeploymentEventsArgs {
    pub deployment_id: DeploymentId,
    pub chunk_def: ChunkDef,
    pub sorting: Option<SortingDefinition<DeploymentEventsSortingKey>>,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetDeploymentEventsResponse {
    Ok(GetDeploymentEventsResult),
    Err(GetDeploymentEventsError),
}

#[derive(CandidType, Deserialize, Debug)]
pub struct GetDeploymentEventsResult {
    pub events: Vec<DeploymentProcessingIdentifiedEvent>,
    pub total_count: usize,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct DeploymentProcessingIdentifiedEvent {
    pub id: DeploymentEventId,
    pub time: TimestampMillis,
    pub event: DeploymentProcessingEvent,
}

#[derive(CandidType, Deserialize, Debug)]
pub enum GetDeploymentEventsError {
    DeploymentNotFound,
    ChunkCountExceedsLimit { max_chunk_count: usize },
}

impl From<Result<GetDeploymentEventsResult, GetDeploymentEventsError>>
    for GetDeploymentEventsResponse
{
    fn from(r: Result<GetDeploymentEventsResult, GetDeploymentEventsError>) -> Self {
        match r {
            Ok(result) => GetDeploymentEventsResponse::Ok(result),
            Err(error) => GetDeploymentEventsResponse::Err(error),
        }
    }
}
