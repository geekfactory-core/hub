use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub enum Permission {
    SetAccessRights,
    SetConfig,
    AddContractTemplate,
    BlockContract,
    BlockContractTemplate,
    RetireContractTemplate,
}

pub type Permissions = Option<Vec<Permission>>;

#[derive(CandidType, Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct AccessRight {
    pub caller: Principal,
    pub permissions: Permissions,
    pub description: Option<String>,
}
