use candid::Principal;
use common_canister_impl::stable_structures::CBor;
use hub_canister_api::types::{Permission, Permissions};
use ic_stable_structures::{DefaultMemoryImpl, RestrictedMemory, StableCell};
use std::collections::BTreeMap;

type RM = RestrictedMemory<DefaultMemoryImpl>;
pub type AccessRights = BTreeMap<Principal, (Permissions, Option<String>)>;

pub struct AccessRightsStorage {
    access_rights: StableCell<CBor<AccessRights>, RM>,
}

impl AccessRightsStorage {
    pub(crate) fn init(memory: RM) -> Self {
        AccessRightsStorage {
            access_rights: StableCell::init(memory, CBor(AccessRights::default())),
        }
    }

    pub(crate) fn is_access_right(&self, caller: &Principal, permission: &Permission) -> bool {
        check_is_access_right(self.access_rights.get(), caller, permission)
    }

    pub(crate) fn get_access_rights(&self) -> &AccessRights {
        self.access_rights.get()
    }

    pub(crate) fn set_access_rights(&mut self, access_rights: AccessRights) {
        self.access_rights.set(CBor(access_rights));
    }
}

pub(crate) fn check_is_access_right(
    access_rights: &AccessRights,
    caller: &Principal,
    permission: &Permission,
) -> bool {
    if access_rights.is_empty() {
        return true;
    }

    access_rights.get(caller).is_some_and(|(permissions, _)| {
        permissions
            .as_ref()
            .is_none_or(|list| list.contains(permission))
    })
}
