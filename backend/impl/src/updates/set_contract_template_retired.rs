use crate::{is_caller_has_access_right, log_info, mutate_state};
use common_canister_types::Timestamped;
use common_contract_api::ContractTemplateId;
use hub_canister_api::{
    set_contract_template_retired::*,
    types::{HubEventType, Permission},
};
use ic_cdk_macros::update;

#[update]
fn set_contract_template_retired(
    Args {
        contract_template_id,
        reason,
    }: Args,
) -> Response {
    set_contract_template_retired_int(contract_template_id, reason).into()
}

pub(crate) fn set_contract_template_retired_int(
    contract_template_id: ContractTemplateId,
    reason: Option<String>,
) -> Result<(), SetContractTemplateRetiredError> {
    if !is_caller_has_access_right(&Permission::RetireContractTemplate) {
        return Err(SetContractTemplateRetiredError::PermissionDenied);
    }

    mutate_state(|state| {
        state
            .get_model()
            .get_contract_templates_storage()
            .get_contract_template(&contract_template_id)
            .ok_or(SetContractTemplateRetiredError::ContractTemplateNotFound)?;

        let env = state.get_env();
        let time = env.get_time().get_current_unix_epoch_time_millis();

        let retired_value = reason.as_ref().map(|r| Timestamped::new(time, r.clone()));

        let model = state.get_model_mut();
        model
            .get_contract_templates_storage_mut()
            .set_retired(&contract_template_id, retired_value);

        model.get_hub_events_storage_mut().add_hub_event(
            time,
            env.get_ic().get_caller(),
            HubEventType::ContractTemplateRetired {
                contract_template_id,
                retired: reason.is_some(),
            },
        );

        log_info!(
            env,
            "Contract template '{contract_template_id}' retired flag set to '{}' by caller '{}'",
            reason.is_some(),
            env.get_ic().get_caller().to_text()
        );

        Ok(())
    })
}
