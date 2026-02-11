use async_trait::async_trait;
use candid::Principal;
use common_canister_impl::components::cmc::api::{
    CreateCanisterArg, CreateCanisterError, IcpXdrConversionRate, NotifyError,
};
use common_canister_impl::components::cmc::interface::{CallWrapperError, Cmc};
use ic_ledger_types::BlockIndex;

pub struct CmcTest {}

#[async_trait]
impl Cmc for CmcTest {
    async fn notify_top_up(
        &self,
        _cmc_canister_id: Principal,
        _block_index: BlockIndex,
        _canister_id: Principal,
    ) -> Result<u128, CallWrapperError<NotifyError>> {
        Ok(100_000)
    }

    async fn create_canister(
        &self,
        _cmc_canister_id: Principal,
        _arg: CreateCanisterArg,
        _cycles: u128,
    ) -> Result<Principal, CallWrapperError<CreateCanisterError>> {
        Ok(ht_get_created_canister_over_cmc())
    }

    async fn get_icp_xdr_conversion_rate(
        &self,
        _cmc_canister_id: Principal,
    ) -> Result<IcpXdrConversionRate, CallWrapperError<()>> {
        Ok(IcpXdrConversionRate {
            xdr_permyriad_per_icp: 20_000,
            timestamp_seconds: 123,
        })
    }
}

pub(crate) fn ht_get_created_canister_over_cmc() -> Principal {
    Principal::from_slice(&[0; 29])
}
