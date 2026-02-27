use common_contract_api::ContractTemplateId;
use hub_canister_api::types::ContractTemplateInformation;

use crate::model::templates::ContractTemplateModel;

pub(crate) fn build_contract_template_information(
    id: &ContractTemplateId,
    model: &ContractTemplateModel,
) -> ContractTemplateInformation {
    ContractTemplateInformation {
        contract_template_id: *id,
        registrar: model.registrar,
        registered: model.registered,
        definition: model.definition.clone(),
        blocked: model.blocked.clone(),
        retired: model.retired.clone(),
        deployments_count: model.deployments_count,
    }
}
