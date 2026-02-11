use common_canister_impl::stable_structures::CBor;
use hub_canister_api::types::Config;
use ic_stable_structures::{DefaultMemoryImpl, RestrictedMemory, StableCell};

type RM = RestrictedMemory<DefaultMemoryImpl>;
type ConfigCell = StableCell<CBor<Config>, RM>;

pub struct ConfigStorage {
    config: ConfigCell,
}

impl ConfigStorage {
    pub(crate) fn init(memory: RM) -> Self {
        ConfigStorage {
            config: StableCell::init(memory, CBor(Config::default())),
        }
    }

    pub(crate) fn get_config(&self) -> &Config {
        self.config.get()
    }

    pub(crate) fn set_config(&mut self, config: Config) {
        self.config.set(CBor(config));
    }
}
