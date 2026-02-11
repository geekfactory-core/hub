use hub_canister_api::types::DeploymentId;
use ic_ledger_types::Subaccount;
use sha2::{Digest, Sha256};

pub fn get_deployment_transit_canister_sub_account(deployment_id: &DeploymentId) -> Subaccount {
    Subaccount({
        let mut hasher = Sha256::new();
        hasher.update([0x0c]);
        hasher.update(b"deployment_transit");
        hasher.update(deployment_id.to_be_bytes());
        hasher.finalize().into()
    })
}
