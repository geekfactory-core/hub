use crate::{
    get_env, is_caller_has_access_right, log_info, mutate_state,
    updates::validate_contract_certificate::parse_canister_from_url_by_regexs,
};
use candid::Principal;
use hub_canister_api::{
    set_config::*,
    types::{Config, HubEventType, Permission},
};
use ic_cdk_macros::update;
use ic_ledger_types::AccountIdentifier;
use regex::Regex;

#[update]
fn set_config(Args { config }: Args) -> Response {
    set_config_int(config).into()
}

pub(crate) fn set_config_int(config: Config) -> Result<(), SetConfigError> {
    if !is_caller_has_access_right(&Permission::SetConfig) {
        return Err(SetConfigError::PermissionDenied);
    }

    let env = get_env();
    validate_config(&config)?;

    log_info!(env, "New config received for apply: {:?}", config);

    mutate_state(|state| {
        let model = state.get_model_mut();
        model.get_config_storage_mut().set_config(config.clone());

        model.get_hub_events_storage_mut().add_hub_event(
            env.get_time().get_current_unix_epoch_time_millis(),
            env.get_ic().get_caller(),
            HubEventType::ConfigSet {
                config: Box::new(config),
            },
        );
        Ok(())
    })
}

fn validate_config(config: &Config) -> Result<(), SetConfigError> {
    let regexes = &config.regex_for_contract_principal_parsing;
    validate_regexes(regexes)?;
    validate_contract_url_pattern(regexes, &config.contract_url_pattern)?;

    AccountIdentifier::from_hex(&config.deployment_fallback_account_hex).map_err(|error| {
        SetConfigError::WrongConfig {
            reason: format!("deployment_fallback_account_hex is wrong: {error}"),
        }
    })?;

    Ok(())
}

fn validate_regexes(regexes: &[String]) -> Result<(), SetConfigError> {
    for regex in regexes {
        if let Err(error) = Regex::new(regex.as_str()) {
            return Err(SetConfigError::WrongConfig {
                reason: format!("regex '{regex}' is wrong: {error}"),
            });
        }
    }
    Ok(())
}

fn validate_contract_url_pattern(regexes: &[String], pattern: &str) -> Result<(), SetConfigError> {
    if pattern.contains("{principal}") {
        let url = pattern.replace(
            "{principal}",
            Principal::management_canister().to_text().as_str(),
        );

        parse_canister_from_url_by_regexs(regexes, url.as_str())
            .map(|_| ())
            .map_err(|error| SetConfigError::WrongConfig {
                reason: format!("contract_url_pattern is wrong: {error:?}"),
            })
    } else {
        Err(SetConfigError::WrongConfig {
            reason: "contract_url_pattern must contain '{principal}'".to_owned(),
        })
    }
}
