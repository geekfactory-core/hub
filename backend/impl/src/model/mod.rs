use crate::model::deployments::DeploymentsStorage;
use access_rights::AccessRightsStorage;
use config::ConfigStorage;
use hub_events::HubEventsStorage;
use ic_canister_sig_creation::signature_map::SignatureMap;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager};
use ic_stable_structures::{DefaultMemoryImpl as DefMem, RestrictedMemory, MAX_PAGES};
use templates::ContractTemplatesStorage;
use wasm::WasmStorage;

pub mod access_rights;
pub mod config;
pub mod deployments;
pub mod hub_events;
pub mod templates;
pub mod wasm;

type RM = RestrictedMemory<DefMem>;

pub struct DataModel {
    config_storage: ConfigStorage,
    access_rights_storage: AccessRightsStorage,
    contract_templates_storage: ContractTemplatesStorage,
    deployments_storage: DeploymentsStorage,
    hub_events_storage: HubEventsStorage,
    wasm_storage: WasmStorage,
    deployments_signature_map: SignatureMap,
}

impl DataModel {
    pub(crate) fn init() -> Self {
        let config_mem = RM::new(DefMem::default(), 0..1);
        let access_rights_mem = RM::new(DefMem::default(), 1..2);
        let mm = MemoryManager::init(RM::new(DefMem::default(), 2..MAX_PAGES));

        let contract_templates_mem = mm.get(MemoryId::new(0));
        let contract_templates_wasm_mem = mm.get(MemoryId::new(1));

        let deployments_mem = mm.get(MemoryId::new(2));
        let deployments_canister_index_mem = mm.get(MemoryId::new(3));
        let deployments_contract_template_index_mem = mm.get(MemoryId::new(4));
        let deployments_deployer_index_mem = mm.get(MemoryId::new(5));
        let deployments_deployer_contract_template_index_mem = mm.get(MemoryId::new(6));
        let deployments_events_log_index_mem = mm.get(MemoryId::new(7));
        let deployments_events_log_data_mem = mm.get(MemoryId::new(8));
        let deployments_event_index_mem = mm.get(MemoryId::new(9));

        let hub_events_index_mem = mm.get(MemoryId::new(10));
        let hub_events_data_mem = mm.get(MemoryId::new(11));

        Self {
            config_storage: ConfigStorage::init(config_mem),
            access_rights_storage: AccessRightsStorage::init(access_rights_mem),
            contract_templates_storage: ContractTemplatesStorage::init(
                contract_templates_mem,
                contract_templates_wasm_mem,
            ),
            deployments_storage: DeploymentsStorage::init(
                deployments_mem,
                deployments_canister_index_mem,
                deployments_contract_template_index_mem,
                deployments_deployer_index_mem,
                deployments_deployer_contract_template_index_mem,
                deployments_events_log_index_mem,
                deployments_events_log_data_mem,
                deployments_event_index_mem,
            ),
            hub_events_storage: HubEventsStorage::init(hub_events_index_mem, hub_events_data_mem),
            wasm_storage: WasmStorage::default(),
            deployments_signature_map: SignatureMap::default(),
        }
    }

    pub(crate) fn get_config_storage(&self) -> &ConfigStorage {
        &self.config_storage
    }

    pub(crate) fn get_config_storage_mut(&mut self) -> &mut ConfigStorage {
        &mut self.config_storage
    }

    pub(crate) fn get_access_rights_storage(&self) -> &AccessRightsStorage {
        &self.access_rights_storage
    }

    pub(crate) fn get_access_rights_storage_mut(&mut self) -> &mut AccessRightsStorage {
        &mut self.access_rights_storage
    }

    pub(crate) fn get_wasm_storage(&self) -> &WasmStorage {
        &self.wasm_storage
    }

    pub(crate) fn get_wasm_storage_mut(&mut self) -> &mut WasmStorage {
        &mut self.wasm_storage
    }

    pub(crate) fn get_contract_templates_storage(&self) -> &ContractTemplatesStorage {
        &self.contract_templates_storage
    }

    pub(crate) fn get_contract_templates_storage_mut(&mut self) -> &mut ContractTemplatesStorage {
        &mut self.contract_templates_storage
    }

    pub(crate) fn get_deployments_storage(&self) -> &DeploymentsStorage {
        &self.deployments_storage
    }

    pub(crate) fn get_deployments_storage_mut(&mut self) -> &mut DeploymentsStorage {
        &mut self.deployments_storage
    }

    pub(crate) fn get_deployments_signature_map(&self) -> &SignatureMap {
        &self.deployments_signature_map
    }

    pub(crate) fn get_deployments_signature_map_mut(&mut self) -> &mut SignatureMap {
        &mut self.deployments_signature_map
    }

    pub(crate) fn get_hub_events_storage(&self) -> &HubEventsStorage {
        &self.hub_events_storage
    }

    pub(crate) fn get_hub_events_storage_mut(&mut self) -> &mut HubEventsStorage {
        &mut self.hub_events_storage
    }
}
