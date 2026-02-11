use std::cell::RefCell;

use async_trait::async_trait;
use candid::Nat;
use common_canister_impl::components::ic_management::IcManagement;
use ic_cdk::{
    call::CallResult,
    management_canister::{
        CanisterIdRecord, CanisterStatusArgs, CanisterStatusResult, CanisterStatusType, ChunkHash,
        ClearChunkStoreArgs, CreateCanisterArgs, DefiniteCanisterSettings, InstallChunkedCodeArgs,
        MemoryMetrics, QueryStats, StoredChunksArgs, UpdateSettingsArgs, UploadChunkArgs,
    },
};

use crate::test::tests::components::cmc::ht_get_created_canister_over_cmc;

thread_local! {
    static __TEST_CHUNKS: RefCell<Vec<ChunkHash>> = RefCell::default();
}

pub struct IcManagementTest {}

#[async_trait]
impl IcManagement for IcManagementTest {
    async fn canister_status(&self, _arg: CanisterStatusArgs) -> CallResult<CanisterStatusResult> {
        Ok(CanisterStatusResult {
            status: CanisterStatusType::Running,
            ready_for_migration: false,
            version: 1,
            settings: DefiniteCanisterSettings::default(),
            module_hash: None,
            memory_size: Nat::default(),
            memory_metrics: MemoryMetrics {
                wasm_memory_size: Nat::default(),
                stable_memory_size: Nat::default(),
                global_memory_size: Nat::default(),
                wasm_binary_size: Nat::default(),
                custom_sections_size: Nat::default(),
                canister_history_size: Nat::default(),
                wasm_chunk_store_size: Nat::default(),
                snapshots_size: Nat::default(),
            },
            cycles: Nat::default(),
            reserved_cycles: Nat::default(),
            idle_cycles_burned_per_day: Nat::default(),
            query_stats: QueryStats {
                num_calls_total: Nat::default(),
                num_instructions_total: Nat::default(),
                request_payload_bytes_total: Nat::default(),
                response_payload_bytes_total: Nat::default(),
            },
        })
    }

    async fn clear_chunk_store(&self, _arg: ClearChunkStoreArgs) -> CallResult<()> {
        __TEST_CHUNKS.with(|chunks| {
            chunks.borrow_mut().clear();
        });

        Ok(())
    }

    async fn upload_chunk(&self, arg: UploadChunkArgs) -> CallResult<ChunkHash> {
        let hash = ChunkHash { hash: arg.chunk };
        __TEST_CHUNKS.with(|chunks| {
            chunks.borrow_mut().push(hash.clone());
        });

        Ok(hash)
    }

    async fn stored_chunks(&self, _arg: StoredChunksArgs) -> CallResult<Vec<ChunkHash>> {
        Ok(__TEST_CHUNKS.with(|chunks| chunks.borrow().clone()))
    }

    async fn install_chunked_code(&self, _arg: InstallChunkedCodeArgs) -> CallResult<()> {
        Ok(())
    }

    async fn create_canister_with_extra_cycles(
        &self,
        _arg: CreateCanisterArgs,
        _extra_cycles: u128,
    ) -> CallResult<CanisterIdRecord> {
        Ok(CanisterIdRecord {
            canister_id: ht_get_created_canister_over_cmc(),
        })
    }

    async fn update_settings(&self, _arg: UpdateSettingsArgs) -> CallResult<()> {
        Ok(())
    }
}
