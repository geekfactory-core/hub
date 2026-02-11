use candid::Principal;
use common_canister_impl::stable_structures::CBor;
use common_canister_types::{TimestampMillis, Timestamped};
use common_contract_api::ContractTemplateId;
use hub_canister_api::types::ContractTemplateDefinition;
use ic_stable_structures::{
    btreemap::Iter, memory_manager::VirtualMemory, DefaultMemoryImpl, RestrictedMemory,
    StableBTreeMap,
};
use serde::{Deserialize, Serialize};

type VM = VirtualMemory<RestrictedMemory<DefaultMemoryImpl>>;
type ContractsTable = StableBTreeMap<ContractTemplateId, CBor<ContractTemplateModel>, VM>;
type WasmTable = StableBTreeMap<ContractTemplateId, Vec<u8>, VM>;

pub struct ContractTemplatesStorage {
    contract_templates_table: ContractsTable,
    wasm_table: WasmTable,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ContractTemplateModel {
    pub registrar: Principal,
    pub registered: TimestampMillis,
    pub definition: ContractTemplateDefinition,
    pub blocked: Option<Timestamped<String>>,
    pub deployments_count: usize,
}

impl ContractTemplatesStorage {
    pub(crate) fn init(contract_templates_memory: VM, wasm_memory: VM) -> Self {
        Self {
            contract_templates_table: StableBTreeMap::init(contract_templates_memory),
            wasm_table: StableBTreeMap::init(wasm_memory),
        }
    }

    pub(crate) fn add_contract_template(
        &mut self,
        registrar: Principal,
        registered: TimestampMillis,
        definition: ContractTemplateDefinition,
        wasm: Vec<u8>,
    ) -> ContractTemplateId {
        let contract_template_id = self.contract_templates_table.len();
        let contract_template = ContractTemplateModel {
            registrar,
            registered,
            definition,
            blocked: None,
            deployments_count: 0,
        };
        self.contract_templates_table
            .insert(contract_template_id, CBor(contract_template));
        self.wasm_table.insert(contract_template_id, wasm);
        contract_template_id
    }

    pub(crate) fn block_contract_template(
        &mut self,
        contract_template_id: &ContractTemplateId,
        time: TimestampMillis,
        reason: String,
    ) {
        self.wasm_table.remove(contract_template_id);
        if let Some(contract_template) = self.contract_templates_table.get(contract_template_id) {
            let mut contract_template = contract_template.to_owned();
            contract_template.blocked = Some(Timestamped::new(time, reason));
            self.contract_templates_table
                .insert(*contract_template_id, CBor(contract_template));
        }
    }

    pub(crate) fn contract_deployed(&mut self, contract_template_id: &ContractTemplateId) {
        if let Some(contract_template) = self.contract_templates_table.get(contract_template_id) {
            let mut contract_template = contract_template.to_owned();
            contract_template.deployments_count += 1;
            self.contract_templates_table
                .insert(*contract_template_id, CBor(contract_template));
        }
    }

    pub(crate) fn get_contract_template(
        &self,
        contract_template_id: &ContractTemplateId,
    ) -> Option<CBor<ContractTemplateModel>> {
        self.contract_templates_table.get(contract_template_id)
    }

    pub(crate) fn get_contract_template_wasm(
        &self,
        contract_template_id: &ContractTemplateId,
    ) -> Option<Vec<u8>> {
        self.wasm_table.get(contract_template_id)
    }

    pub(crate) fn get_iter(&self) -> Iter<'_, ContractTemplateId, CBor<ContractTemplateModel>, VM> {
        self.contract_templates_table.iter()
    }
}
