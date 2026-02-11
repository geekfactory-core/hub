use crate::{is_caller_has_access_right, log_info, mutate_state, read_state};
use common_contract_api::get_wasm_hash;
use hub_canister_api::{
    add_contract_template::*,
    types::{ContractTemplateDefinition, HubEventType, Permission, UploadWasmGrant},
};
use ic_cdk_macros::update;

#[update]
fn add_contract_template(
    Args {
        contract_template_definition,
    }: Args,
) -> Response {
    add_contract_template_int(contract_template_definition).into()
}

pub(crate) fn add_contract_template_int(
    contract_template_definition: ContractTemplateDefinition,
) -> Result<AddContractTemplateResult, AddContractTemplateError> {
    if !is_caller_has_access_right(&Permission::AddContractTemplate) {
        return Err(AddContractTemplateError::PermissionDenied);
    }

    let grant = get_upload_wasm_grant()?;
    let wasm = validate_uploaded_wasm(&grant)?;
    check_contract_template_definition(&contract_template_definition, &wasm)?;

    // add contract template
    mutate_state(|state| {
        let env = state.get_env();
        let model = state.get_model_mut();

        let registrar = env.get_ic().get_caller();
        let registered = env.get_time().get_current_unix_epoch_time_millis();

        let contract_template_id = model
            .get_contract_templates_storage_mut()
            .add_contract_template(registrar, registered, contract_template_definition, wasm);

        model.get_wasm_storage_mut().set_upload_wasm_grant(None);
        model.get_hub_events_storage_mut().add_hub_event(
            env.get_time().get_current_unix_epoch_time_millis(),
            env.get_ic().get_caller(),
            HubEventType::ContractTemplateAdded {
                contract_template_id,
            },
        );

        log_info!(
            state.get_env(),
            "Contract template '{contract_template_id}' has been added successfully!"
        );

        Ok(AddContractTemplateResult {
            contract_template_id,
        })
    })
}

fn get_upload_wasm_grant() -> Result<UploadWasmGrant, AddContractTemplateError> {
    read_state(|state| {
        state
            .get_model()
            .get_wasm_storage()
            .get_upload_wasm_grant()
            .cloned()
            .ok_or(AddContractTemplateError::GrantNotFound)
    })
}

fn validate_uploaded_wasm(grant: &UploadWasmGrant) -> Result<Vec<u8>, AddContractTemplateError> {
    let wasm = mutate_state(|state| {
        state
            .get_model_mut()
            .get_wasm_storage_mut()
            .get_upload_wasm_mut_unsafe()
            .clone()
    });

    let uploaded_length = wasm.len();
    if uploaded_length != grant.wasm_length {
        return Err(AddContractTemplateError::InvalidWasmLength { uploaded_length });
    }

    Ok(wasm)
}

fn check_contract_template_definition(
    contract_template_definition: &ContractTemplateDefinition,
    wasm: &Vec<u8>,
) -> Result<(), AddContractTemplateError> {
    // check wasm hash

    let hash = get_wasm_hash(wasm);
    if hash != contract_template_definition.wasm_hash {
        return Err(AddContractTemplateError::InvalidWasmHash { hash });
    }

    read_state(|state| {
        let config = state.get_model().get_config_storage().get_config();

        // check field restrictions
        if contract_template_definition.name.len() > config.name_max_length {
            return Err(AddContractTemplateError::ContractNameIsTooLong {
                max_length: config.name_max_length,
            });
        }
        if contract_template_definition.short_description.len()
            > config.short_description_max_length
        {
            return Err(
                AddContractTemplateError::ContractShortDescriptionIsTooLong {
                    max_length: config.short_description_max_length,
                },
            );
        }
        if contract_template_definition
            .long_description
            .as_ref()
            .filter(|desc| desc.len() > config.long_description_max_length)
            .is_some()
        {
            return Err(AddContractTemplateError::ContractLongDescriptionIsTooLong {
                max_length: config.long_description_max_length,
            });
        }

        // check contract template uniqueness
        if let Some(error) = state
            .get_model()
            .get_contract_templates_storage()
            .get_iter()
            .find_map(|entry| {
                let model = entry.value();
                if model.definition.name == contract_template_definition.name {
                    Some(AddContractTemplateError::ContractTemplateNameAlreadyExists)
                } else if model.definition.wasm_hash == contract_template_definition.wasm_hash {
                    Some(AddContractTemplateError::ContractTemplateWasmAlreadyExists)
                } else {
                    None
                }
            })
        {
            Err(error)
        } else {
            Ok(())
        }
    })
}
