use std::cell::RefCell;

use common_canister_impl::components::time::Time;
use common_canister_types::{
    millis_to_nanos, DelayedTimestampMillis, TimestampMillis, TimestampNanos,
};

thread_local! {
    static __TIME: RefCell<Option<TimestampMillis>> = RefCell::default();
}

pub fn ht_set_test_time(now: TimestampMillis) {
    __TIME.with(|time| {
        *time.borrow_mut() = Some(now);
    });
}

pub struct TimeTest;

impl Time for TimeTest {
    fn get_current_unix_epoch_time_nanos(&self) -> TimestampNanos {
        millis_to_nanos(&self.get_current_unix_epoch_time_millis())
    }

    fn get_current_unix_epoch_time_millis(&self) -> TimestampMillis {
        __TIME.with(|time| *time.borrow().as_ref().unwrap_or(&0))
    }

    fn get_delayed_time_millis(&self, time: TimestampMillis) -> DelayedTimestampMillis {
        let now = self.get_current_unix_epoch_time_millis();
        DelayedTimestampMillis {
            time,
            delay: time.saturating_sub(now),
        }
    }

    fn get_delayed_time_by_delay_millis(&self, delay: TimestampMillis) -> DelayedTimestampMillis {
        let now = self.get_current_unix_epoch_time_millis();
        DelayedTimestampMillis {
            time: now + delay,
            delay,
        }
    }
}
