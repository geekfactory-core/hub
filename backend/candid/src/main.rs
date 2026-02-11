use icgeek_candid_gen::*;

#[allow(deprecated)]
fn main() {
    generate_query_candid_method!(common_canister_api, get_canister_metrics);
    generate_query_candid_method!(hub_canister_api, get_access_rights);
    generate_query_candid_method!(hub_canister_api, get_config);
    generate_query_candid_method!(hub_canister_api, get_contract_template);
    generate_query_candid_method!(hub_canister_api, get_contract_templates);
    generate_query_candid_method!(hub_canister_api, get_hub_events);
    generate_query_candid_method!(hub_canister_api, get_contract_activation_code);
    generate_query_candid_method!(hub_canister_api, get_deployment_events);
    generate_query_candid_method!(hub_canister_api, get_deployment);
    generate_query_candid_method!(hub_canister_api, get_deployments);
    generate_query_candid_method!(hub_canister_api, obtain_contract_certificate);

    generate_update_candid_method!(common_canister_api, get_canister_status, None);
    generate_update_candid_method!(hub_canister_api, set_access_rights);
    generate_update_candid_method!(hub_canister_api, set_config);
    generate_update_candid_method!(hub_canister_api, set_upload_wasm_grant);
    generate_update_candid_method!(hub_canister_api, upload_wasm_chunk);
    generate_update_candid_method!(hub_canister_api, add_contract_template);
    generate_update_candid_method!(hub_canister_api, block_contract_template);
    generate_update_candid_method!(hub_canister_api, deploy_contract);
    generate_update_candid_method!(hub_canister_api, process_deployment);
    generate_update_candid_method!(hub_canister_api, cancel_deployment);
    generate_update_candid_method!(hub_canister_api, retry_generate_contract_certificate);
    generate_update_candid_method!(hub_canister_api, initialize_contract_certificate);
    generate_update_candid_method!(hub_canister_api, validate_contract_certificate);

    candid::export_service!();
    std::print!("{}", __export_service());
}
