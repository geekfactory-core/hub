use common_canister_impl::stable_structures::CBor;
use common_canister_types::{TimestampMillis, Timestamped};
use hub_canister_api::types::DeploymentId;
use ic_stable_structures::{
    memory_manager::VirtualMemory, DefaultMemoryImpl, RestrictedMemory, StableLog,
};
use serde::{Deserialize, Serialize};

type VM = VirtualMemory<RestrictedMemory<DefaultMemoryImpl>>;
type ContractBlocksLog = StableLog<CBor<ContractBlockBatch>, VM, VM>;

#[derive(Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
pub struct ContractBlockBatch {
    pub blocked_at: TimestampMillis,
    pub reason: String,
    pub deployment_ids: Vec<DeploymentId>,
}

pub struct BlockedContractsStorage {
    contract_blocks: ContractBlocksLog,
}

impl BlockedContractsStorage {
    pub(crate) fn init(index_memory: VM, data_memory: VM) -> Self {
        Self {
            contract_blocks: StableLog::init(index_memory, data_memory),
        }
    }

    pub(crate) fn add_contract_block_batch(
        &mut self,
        blocked_at: TimestampMillis,
        reason: String,
        deployment_ids: Vec<DeploymentId>,
    ) {
        let record = CBor(ContractBlockBatch {
            blocked_at,
            reason,
            deployment_ids,
        });

        if let Err(error) = self.contract_blocks.append(&record) {
            ic_cdk::println!(
                "Hub: failed to append blocked contracts {:?}: {error:?}",
                *record
            );
        }
    }

    pub(crate) fn get_contract_blocks_len(&self) -> u64 {
        self.contract_blocks.len()
    }

    pub(crate) fn get_contract_block_batch(&self, idx: u64) -> Option<CBor<ContractBlockBatch>> {
        self.contract_blocks.get(idx)
    }

    pub(crate) fn find_deployment_block(
        &self,
        deployment_id: &DeploymentId,
    ) -> Option<Timestamped<String>> {
        for idx in 0..self.contract_blocks.len() {
            let Some(record) = self.contract_blocks.get(idx) else {
                continue;
            };

            if record
                .deployment_ids
                .iter()
                .any(|blocked_id| blocked_id == deployment_id)
            {
                return Some(Timestamped::new(record.blocked_at, record.reason.clone()));
            }
        }

        None
    }
}
