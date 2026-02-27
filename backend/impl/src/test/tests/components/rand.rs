use async_trait::async_trait;
use common_canister_impl::components::rand::RandGenerator;

pub(crate) struct IcRandTest;

#[async_trait]
impl RandGenerator for IcRandTest {
    async fn generate_16(&self) -> Result<Vec<u8>, String> {
        Ok(vec![16])
    }

    async fn generate_32(&self) -> Result<Vec<u8>, String> {
        Ok(vec![32])
    }
}
