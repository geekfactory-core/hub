use candid::Encode;
use common_certification::Certification;
use common_contract_api::SignedContractCertificate;
use ic_canister_sig_creation::signature_map::CanisterSigError;
use sha2::{Digest, Sha256};

pub struct CertificationTest;

impl Certification for CertificationTest {
    fn add_contract_signature_to_signature_map(
        self: &Self,
        _sigs: &mut ic_canister_sig_creation::signature_map::SignatureMap,
        contract_certificate: &common_contract_api::ContractCertificate,
    ) -> common_certification::Hash {
        let mut hasher = Sha256::new();
        hasher.update(Encode!(contract_certificate).unwrap());
        hasher.finalize().into()
    }

    fn get_signed_contract_certificate(
        self: &Self,
        _sigs: &ic_canister_sig_creation::signature_map::SignatureMap,
        contract_certificate: &common_contract_api::ContractCertificate,
    ) -> Result<SignedContractCertificate, CanisterSigError> {
        Ok(SignedContractCertificate {
            contract_certificate: contract_certificate.clone(),
            signature: vec![1, 2, 4],
        })
    }

    fn verify_signed_contract_certificate(
        self: &Self,
        signed_contract_certificate: &SignedContractCertificate,
        _ic_root_public_key_raw: &[u8],
    ) -> Result<(), String> {
        if signed_contract_certificate.signature != vec![1, 2, 4] {
            Err("Invalid signature".to_string())
        } else {
            Ok(())
        }
    }
}
