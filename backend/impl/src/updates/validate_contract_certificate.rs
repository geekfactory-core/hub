use std::str::FromStr;

use crate::{get_env, read_state};
use candid::Principal;
use common_certification::verify_signed_contract_certificate;
use common_contract_c2c_client::get_contract_certificate;
use hub_canister_api::validate_contract_certificate::*;
use ic_cdk::management_canister::{canister_info, CanisterInfoArgs};
use ic_cdk_macros::update;
use regex::Regex;

#[update]
async fn validate_contract_certificate(args: Args) -> Response {
    validate_contract_certificate_int(args).await.into()
}

async fn validate_contract_certificate_int(
    Args { contract_reference }: Args,
) -> Result<ValidateContractCertificateResult, ValidateContractCertificateError> {
    let env = get_env();
    let hub_canister = env.get_ic().get_canister();

    let contract_canister = obtain_contract_canister(contract_reference)?;

    let certificate = get_contract_certificate(contract_canister)
        .await
        .map(|result| result.certificate)
        .map_err(|_| ValidateContractCertificateError::CertificateUnavailable)?;

    if certificate.contract_certificate.contract_canister != contract_canister {
        return Err(ValidateContractCertificateError::CertificateWrong {
            reason: "wrong contract canister".to_string(),
        });
    }

    if certificate.contract_certificate.hub_canister != hub_canister {
        return Err(ValidateContractCertificateError::CertificateWrong {
            reason: "wrong hub canister".to_string(),
        });
    }

    verify_signed_contract_certificate(&certificate, env.get_ic().get_root_public_key_raw())
        .map_err(|reason| ValidateContractCertificateError::CertificateWrong { reason })?;

    let contract_info = canister_info(&CanisterInfoArgs {
        canister_id: contract_canister,
        num_requested_changes: None,
    })
    .await
    .map_err(|_| ValidateContractCertificateError::ContractInfoUnavailable)?;

    check_canister_wasm_hash(
        contract_info.module_hash,
        certificate.contract_certificate.contract_wasm_hash.clone(),
        "wrong contract canister wasm hash",
    )?;

    if contract_info.controllers != vec![contract_canister] {
        return Err(ValidateContractCertificateError::CertificateWrong {
            reason: "contract canister controller is not contract".to_string(),
        });
    }

    let now = env.get_time().get_current_unix_epoch_time_millis();
    let delay_to_expiration_millis = if certificate.contract_certificate.expiration > now {
        Some(certificate.contract_certificate.expiration - now)
    } else {
        None
    };

    Ok(ValidateContractCertificateResult {
        certificate,
        delay_to_expiration_millis,
    })
}

fn obtain_contract_canister(
    contract_reference: ContractReference,
) -> Result<Principal, ValidateContractCertificateError> {
    match contract_reference {
        ContractReference::Canister(canister_id) => Ok(canister_id),
        ContractReference::Url(url) => parse_canister_from_url(url.as_str()),
    }
}

pub(crate) fn parse_canister_from_url(
    url: &str,
) -> Result<Principal, ValidateContractCertificateError> {
    read_state(|state| {
        parse_canister_from_url_by_regexs(
            &state
                .get_model()
                .get_config_storage()
                .get_config()
                .regex_for_contract_principal_parsing,
            url,
        )
    })
}

pub(crate) fn parse_canister_from_url_by_regexs(
    regexs: &[String],
    url: &str,
) -> Result<Principal, ValidateContractCertificateError> {
    if regexs.is_empty() {
        return Err(
            ValidateContractCertificateError::ValidateContractUrlUnavailable {
                reason: "regexes are empty".to_string(),
            },
        );
    }

    for regex in regexs {
        match Regex::new(regex.as_str()) {
            Ok(re) => {
                if let Some(principal) = find_principal(re, url) {
                    return Ok(principal);
                }
            }
            Err(error) => {
                return Err(
                    ValidateContractCertificateError::ValidateContractUrlUnavailable {
                        reason: format!("regex '{regex}' parse error: {error:?}"),
                    },
                )
            }
        }
    }

    Err(ValidateContractCertificateError::InvalidContractReferenceUrl)
}

fn find_principal(re: Regex, url: &str) -> Option<Principal> {
    re.captures(url)
        .and_then(|captures| captures.name("principal").map(|m| m.as_str()))
        .and_then(|str| Principal::from_str(str).ok())
}

fn check_canister_wasm_hash(
    hash: Option<Vec<u8>>,
    wasm_hash: String,
    error: &str,
) -> Result<(), ValidateContractCertificateError> {
    if hash.is_some_and(|blob| wasm_hash == hex::encode(blob)) {
        Ok(())
    } else {
        Err(ValidateContractCertificateError::CertificateWrong {
            reason: error.to_string(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_url() {
        assert_eq!(
            find_principal(
                Regex::new("^(?P<scheme>https?)://(?P<principal>[^.:/?#]+)").unwrap(),
                "http://qhbym-qaaaa-aaaaa-aaafq-cai.localhost:8080/",
            )
            .unwrap(),
            Principal::from_str("qhbym-qaaaa-aaaaa-aaafq-cai").unwrap()
        );
    }
}
