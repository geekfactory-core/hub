use crate::{is_caller_has_access_right, log_info, mutate_state};
use common_contract_api::ContractTemplateId;
use hub_canister_api::{
    block_contract_template::*,
    types::{HubEventType, Permission},
};
use ic_cdk_macros::update;

#[update]
fn block_contract_template(
    Args {
        contract_template_id,
        reason,
    }: Args,
) -> Response {
    block_contract_template_int(contract_template_id, reason).into()
}

pub(crate) fn block_contract_template_int(
    contract_template_id: ContractTemplateId,
    reason: String,
) -> Result<(), BlockContractTemplateError> {
    if !is_caller_has_access_right(&Permission::BlockContractTemplate) {
        return Err(BlockContractTemplateError::PermissionDenied);
    }

    mutate_state(|state| {
        state
            .get_model()
            .get_contract_templates_storage()
            .get_contract_template(&contract_template_id)
            .ok_or(BlockContractTemplateError::ContractTemplateNotFound)
            .and_then(|contract_template| {
                if contract_template.blocked.is_some() {
                    Err(BlockContractTemplateError::ContractTemplateAlreadyBlocked)
                } else {
                    Ok(())
                }
            })?;

        let env = state.get_env();

        let model = state.get_model_mut();
        let time = env.get_time().get_current_unix_epoch_time_millis();
        model
            .get_contract_templates_storage_mut()
            .block_contract_template(&contract_template_id, time, reason.clone());

        model.get_hub_events_storage_mut().add_hub_event(
            time,
            env.get_ic().get_caller(),
            HubEventType::ContractTemplateBlocked {
                contract_template_id,
            },
        );

        log_info!(
            env,
            "Contract template '{contract_template_id}' blocked by caller '{}' ({reason})",
            env.get_ic().get_caller().to_text()
        );

        Ok(())
    })
}
