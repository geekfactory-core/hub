use candid::Principal;
use common_canister_impl::stable_structures::CBor;
use common_canister_types::TimestampMillis;
use hub_canister_api::types::{HubEvent, HubEventType};
use ic_stable_structures::{
    memory_manager::VirtualMemory, DefaultMemoryImpl, RestrictedMemory, StableLog,
};

type VM = VirtualMemory<RestrictedMemory<DefaultMemoryImpl>>;
type HubEventsLog = StableLog<CBor<HubEvent>, VM, VM>;

pub struct HubEventsStorage {
    events: HubEventsLog,
}

impl HubEventsStorage {
    pub(crate) fn init(index_memory: VM, data_memory: VM) -> Self {
        HubEventsStorage {
            events: StableLog::init(index_memory, data_memory),
        }
    }

    pub(crate) fn add_hub_event(
        &mut self,
        time: TimestampMillis,
        caller: Principal,
        event: HubEventType,
    ) {
        let event = CBor(HubEvent {
            time,
            event,
            caller,
        });

        if let Err(error) = self.events.append(&event) {
            ic_cdk::println!("Hub: failed to append event {:?}: {error:?}", *event);
        }
    }

    pub(crate) fn get_hub_events_len(&self) -> u64 {
        self.events.len()
    }

    pub(crate) fn get_hub_event(&self, idx: u64) -> Option<CBor<HubEvent>> {
        self.events.get(idx)
    }
}
