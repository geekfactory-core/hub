use crate::components::Environment;
use candid::Principal;
use common_canister_impl::components::cmc::interface_impl::CmcImpl;
use common_canister_impl::components::ic::{Ic, IcImpl};
use common_canister_impl::components::ic_management::IcManagementImpl;
use common_canister_impl::components::icrc2_ledger::ICRC2LedgerImpl;
use common_canister_impl::components::ledger::LedgerImpl;
use common_canister_impl::components::logger::LocalLoggerImpl;
use common_canister_impl::components::rand::IcRandGenerator;
use common_canister_impl::components::time::TimeImpl;
use common_certification::CertificationImpl;

pub(crate) fn create_environment() -> Environment {
    #[cfg(not(network = "local"))]
    {
        create_environment_int(
        b"\x81\x4c\x0e\x6e\xc7\x1f\xab\x58\x3b\x08\xbd\x81\x37\x3c\x25\x5c\x3c\x37\x1b\x2e\x84\x86\x3c\x98\xa4\xf1\xe0\x8b\x74\x23\x5d\x14\xfb\x5d\x9c\x0c\xd5\x46\xd9\x68\x5f\x91\x3a\x0c\x0b\x2c\xc5\x34\x15\x83\xbf\x4b\x43\x92\xe4\x67\xdb\x96\xd6\x5b\x9b\xb4\xcb\x71\x71\x12\xf8\x47\x2e\x0d\x5a\x4d\x14\x50\x5f\xfd\x74\x84\xb0\x12\x91\x09\x1c\x5f\x87\xb9\x88\x83\x46\x3f\x98\x09\x1a\x0b\xaa\xae".to_vec(),
            ic_ledger_types::MAINNET_LEDGER_CANISTER_ID,
        )
    }
    #[cfg(network = "local")]
    {
        create_environment_int(
            include_bytes!("local_root_public_key.raw").to_vec(),
            Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap(),
        )
    }
}

fn create_environment_int(
    root_public_key_raw: Vec<u8>,
    ledger_canister_id: Principal,
) -> Environment {
    let ic_impl = IcImpl::new(root_public_key_raw);
    Environment::new(
        Box::new(LedgerImpl::new(ledger_canister_id, ic_impl.get_canister())),
        Box::new(ICRC2LedgerImpl::new(ledger_canister_id)),
        Box::new(LocalLoggerImpl {}),
        Box::new(TimeImpl {}),
        Box::new(CmcImpl {}),
        Box::new(IcRandGenerator {}),
        Box::new(ic_impl),
        Box::new(IcManagementImpl {}),
        Box::new(CertificationImpl {}),
    )
}
