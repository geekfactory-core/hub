use std::cell::RefCell;

use candid::Principal;
use common_canister_impl::components::ic::{is_principal_anonymous, Ic};
use common_canister_types::CanisterMetrics;

thread_local! {
    static __TEST_CALLER: RefCell<Option<Principal>> = RefCell::default();
}

pub fn ht_set_test_caller(principal: Principal) {
    __TEST_CALLER.with(|caller| {
        *caller.borrow_mut() = Some(principal);
    });
}

pub(crate) fn ht_get_test_hub_canister() -> Principal {
    Principal::from_text("xapqu-4qaaa-aaaak-quexq-cai").unwrap()
}

pub struct IcTest {
    root_public_key: Vec<u8>,
}

impl IcTest {
    pub fn new() -> Self {
        Self {
            root_public_key: vec![1],
        }
    }
}

impl Ic for IcTest {
    fn get_root_public_key_raw(&self) -> &[u8] {
        &self.root_public_key.as_slice()
    }

    fn get_canister(&self) -> Principal {
        ht_get_test_hub_canister()
    }

    fn get_canister_metrics(&self) -> common_canister_types::CanisterMetrics {
        CanisterMetrics {
            stable_memory_size: 1,
            heap_memory_size: 2,
            cycles: 3,
        }
    }

    fn get_caller(&self) -> Principal {
        __TEST_CALLER.with(|caller| caller.borrow().clone().unwrap_or(Principal::anonymous()))
    }

    fn is_caller_anonymous(&self) -> bool {
        is_principal_anonymous(&self.get_caller())
    }

    fn set_certified_data(&self, _data: &[u8]) {}

    fn get_cost_create_canister(&self) -> u128 {
        1_000
    }
}
