#[cfg(test)]
mod tests {
    mod components;
    mod contract_management;
    mod deployment_management;
    pub(crate) mod drivers;
    mod expenses_calculator;
    mod set_access_rights;
    mod set_config;
    pub(crate) mod support;

    use candid::Principal;
    use common_canister_impl::components::ic::Ic;
    use hub_canister_api::types::Config;
    use ic_ledger_types::{AccountIdentifier, DEFAULT_SUBACCOUNT};

    use crate::{
        components::Environment,
        init_state,
        model::DataModel,
        read_state,
        state::CanisterState,
        test::tests::components::{
            certification::CertificationTest,
            cmc::CmcTest,
            ic::{ht_reset_caller, IcTest},
            ic_management::{ht_reset_ic_chunks, IcManagementTest},
            icrc2_ledger::{ht_reset_icrc2, ICRC2LedgerTest},
            ledger::{ht_reset_ledger, LedgerTest},
            logger::PrintLoggerImpl,
            rand::IcRandTest,
            time::{ht_reset_time, TimeTest},
        },
        updates::set_config::set_config_int,
    };

    pub(crate) fn ht_get_test_admin() -> Principal {
        Principal::from_text("lpag6-ktxsv-3oewm-s4gok-fzo2e-qcn2v-kzdpi-eozwc-ddv2o-rbbx4-wae")
            .unwrap()
    }

    pub(crate) fn ht_get_test_user() -> Principal {
        Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap()
    }

    pub(crate) fn ht_init_test_hub() {
        // Reset all thread-local test state from any previous test run on this thread.
        ht_reset_ledger();
        ht_reset_icrc2();
        ht_reset_time();
        ht_reset_caller();
        ht_reset_ic_chunks();
        init_state(CanisterState::new(
            ht_create_environment(),
            DataModel::init(),
        ));
    }

    pub(crate) fn ht_set_initial_config() {
        let name_max_length = 100;
        let short_description_max_length = 1000;
        let long_description_max_length = 1000;

        let config =
            read_state(|state| state.get_model().get_config_storage().get_config().clone());
        let result = set_config_int(Config {
            contract_url_pattern: "http://{principal}.localhost:8080".to_owned(),
            regex_for_contract_principal_parsing: vec![
                "^(?P<scheme>http)://(?P<principal>[^.:/?#]+)[.]localhost[:]8080".to_string(),
            ],
            deployment_fallback_account_hex: AccountIdentifier::new(
                &Principal::management_canister(),
                &DEFAULT_SUBACCOUNT,
            )
            .to_hex(),
            name_max_length,
            short_description_max_length,
            long_description_max_length,
            ..config
        });
        assert!(result.is_ok());
    }

    fn ht_create_environment() -> Environment {
        let ic = IcTest::new();
        Environment::new(
            Box::new(LedgerTest::new(ic.get_canister())),
            Box::new(ICRC2LedgerTest {}),
            Box::new(PrintLoggerImpl {}),
            Box::new(TimeTest {}),
            Box::new(CmcTest {}),
            Box::new(IcRandTest {}),
            Box::new(ic),
            Box::new(IcManagementTest {}),
            Box::new(CertificationTest {}),
        )
    }

    #[macro_export]
    macro_rules! ht_last_hub_event_matches {
        ($pattern:pat $(if $guard:expr)? $(,)?) => {
            crate::read_state(|state| {
                assert!(
                    matches!(
                        &state
                            .get_model()
                            .get_hub_events_storage()
                            .get_hub_event(
                                state
                                    .get_model()
                                    .get_hub_events_storage()
                                    .get_hub_events_len()
                                    - 1
                            )
                            .unwrap()
                            .event,
                            $pattern $(if $guard)?
                    ),
                    "last hub event mismatch"
                );
            });
        };
    }

    #[macro_export]
    macro_rules! ht_result_ok_matches {
        ($result:expr, $pattern:pat $(if $guard:expr)? $(,)?) => {
            match $result {
                Ok(value) => assert!(matches!(value, $pattern $(if $guard)?)),
                Err(e) => panic!("Expected Ok, got Err: {:?}", e),
            }
        };
    }

    #[macro_export]
    macro_rules! ht_result_err_matches {
        ($result:expr, $pattern:pat $(if $guard:expr)? $(,)?) => {
            match $result {
                Err(e) => assert!(matches!(e, $pattern $(if $guard)?)),
                Ok(v) => panic!("Expected Err, got Ok: {:?}", v),
            }
        };
    }

    #[macro_export]
    macro_rules! ht_deployment_state_matches {
        ($deployment_id:expr, $pattern:pat $(if $guard:expr)? $(,)?) => {
            $crate::read_state(|state| {
                let dstate = &state
                    .get_model()
                    .get_deployments_storage()
                    .get_deployment($deployment_id)
                    .unwrap()
                    .state
                    .value;

                assert!(matches!(
                    dstate,
                    $pattern $(if $guard)?
                ));
            });
        };
    }
}
