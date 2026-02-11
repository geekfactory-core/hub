use candid::{CandidType, Principal};
use common_canister_types::TimestampMillis;
use common_contract_api::ContractTemplateId;
use serde::{Deserialize, Serialize};

use super::{AccessRight, Config};

#[derive(CandidType, Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
pub enum HubEventType {
    AccessRightsSet {
        access_rights: Vec<AccessRight>,
    },
    ConfigSet {
        config: Box<Config>,
    },
    ContractTemplateAdded {
        contract_template_id: ContractTemplateId,
    },
    ContractTemplateBlocked {
        contract_template_id: ContractTemplateId,
    },
}

#[derive(CandidType, Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
pub struct HubEvent {
    pub time: TimestampMillis,
    pub caller: Principal,
    pub event: HubEventType,
}
