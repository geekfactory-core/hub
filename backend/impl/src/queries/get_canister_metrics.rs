use crate::get_env;
use common_canister_api::get_canister_metrics::*;
use ic_cdk_macros::query;

#[query]
fn get_canister_metrics() -> Response {
    get_canister_metrics_int().into()
}

pub(crate) fn get_canister_metrics_int() -> Result<GetCanisterMetricsResult, GetCanisterMetricsError>
{
    Ok(GetCanisterMetricsResult {
        metrics: get_env().get_ic().get_canister_metrics(),
    })
}
