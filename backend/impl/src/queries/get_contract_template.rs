use std::ops::Deref;

use common_contract_api::ContractTemplateId;
use hub_canister_api::get_contract_template::*;
use ic_cdk_macros::query;

use crate::{handlers::templates::build_contract_template_information, read_state};

#[query]
fn get_contract_template(
    Args {
        contract_template_id,
    }: Args,
) -> Response {
    get_contract_template_int(contract_template_id).into()
}

pub(crate) fn get_contract_template_int(
    contract_template_id: ContractTemplateId,
) -> Result<GetContractTemplateResult, GetContractTemplateError> {
    read_state(|state| {
        state
            .get_model()
            .get_contract_templates_storage()
            .get_contract_template(&contract_template_id)
            .map(|model| GetContractTemplateResult {
                contract_template: build_contract_template_information(
                    &contract_template_id,
                    model.deref(),
                ),
            })
            .ok_or(GetContractTemplateError::ContractTemplateNotFound)
    })
}
