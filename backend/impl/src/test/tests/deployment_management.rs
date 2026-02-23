use candid::Principal;
use common_canister_impl::components::ledger::to_account_identifier;
use common_canister_types::{LedgerAccount, TimestampMillis};
use hub_canister_api::{
    cancel_deployment::CancelDeploymentError,
    deploy_contract::DeployContractError,
    get_contract_activation_code::GetContractActivationCodeError,
    get_deployment::{DeploymentFilter, GetDeploymentError, GetDeploymentResult},
    initialize_contract_certificate::InitializeContractCertificateError,
    obtain_contract_certificate::ObtainContractCertificateError,
    process_deployment::ProcessDeploymentError,
    types::{
        AccessRight, Config, CreateContractCanisterStrategy, CyclesConvertingStrategy,
        DeploymentId, DeploymentResult, DeploymentState, FinalizeDeploymentState,
        IcpXdrConversionRateStrategy, Permission,
    },
};
use ic_ledger_types::{AccountIdentifier, DEFAULT_SUBACCOUNT};

use crate::{
    get_env,
    handlers::{
        deployments::expenses_calculator::round_e8s_ceil,
        wallet::get_deployment_transit_canister_sub_account,
    },
    ht_deployment_state_matches, ht_result_err_matches,
    queries::{
        get_contract_activation_code::get_contract_activation_code_int,
        get_deployment::get_deployment_int,
        obtain_contract_certificate::obtain_contract_certificate_int,
    },
    read_state,
    test::tests::{
        components::{
            cmc::ht_get_created_canister_over_cmc,
            ic::ht_set_test_caller,
            icrc2_ledger::ht_approve_account,
            ledger::{ht_deposit_account, ht_get_account_balance, HT_LEDGER_FEE},
            time::ht_set_test_time,
        },
        contract_management::{
            ht_add_contract, ht_get_face_contract_def, TEST_CONTRACT_INITIAL_CYCLES,
        },
        ht_get_test_admin, ht_get_test_user,
    },
    updates::{
        cancel_deployment::cancel_deployment_int, deploy_contract::deploy_contract_int,
        initialize_contract_certificate::initialize_contract_certificate_int,
        process_deployment::process_deployment_int, set_access_rights::set_access_rights_int,
        set_config::set_config_int,
        set_contract_template_retired::set_contract_template_retired_int,
    },
};

#[tokio::test]
async fn test_deploy_contract_caller_not_authorized() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let contract_template_id =
        ht_add_contract(admin, contract_def, vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert_eq!(contract_template_id, 0);

    let approved_account = LedgerAccount::Account {
        owner: ht_get_test_user(),
        subaccount: None,
    };

    ht_set_test_caller(Principal::anonymous());
    let result = deploy_contract_int(approved_account.clone(), contract_template_id, None).await;
    ht_result_err_matches!(result, DeployContractError::CallerNotAuthorized);
}

#[tokio::test]
async fn test_deploy_contract_deployment_unavailable() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let contract_template_id =
        ht_add_contract(admin, contract_def, vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert_eq!(contract_template_id, 0);

    let approved_account = LedgerAccount::Account {
        owner: ht_get_test_user(),
        subaccount: None,
    };

    ht_set_test_caller(admin);
    let result = deploy_contract_int(approved_account.clone(), contract_template_id, None).await;
    ht_result_err_matches!(result, DeployContractError::DeploymentUnavailable);
}

#[tokio::test]
async fn test_deploy_contract_contract_not_found() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let contract_template_id =
        ht_add_contract(admin, contract_def, vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert_eq!(contract_template_id, 0);

    let approved_account = LedgerAccount::Account {
        owner: ht_get_test_user(),
        subaccount: None,
    };

    ht_set_test_caller(admin);
    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let config = Config {
        is_deployment_available: true,
        ..config.clone()
    };
    assert!(set_config_int(config.clone()).is_ok());

    ht_set_test_caller(ht_get_test_user());
    let result =
        deploy_contract_int(approved_account.clone(), contract_template_id + 1, None).await;
    ht_result_err_matches!(result, DeployContractError::ContractTemplateNotFound);
}

#[tokio::test]
async fn test_deploy_contract_invalid_approved_account() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let contract_template_id =
        ht_add_contract(admin, contract_def, vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert_eq!(contract_template_id, 0);

    ht_set_test_caller(admin);
    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let config = Config {
        is_deployment_available: true,
        ..config.clone()
    };
    assert!(set_config_int(config.clone()).is_ok());

    let deployer = ht_get_test_user();
    ht_set_test_caller(deployer);

    let approved_account = LedgerAccount::Account {
        owner: deployer,
        subaccount: Some(vec![1]),
    };
    let result = deploy_contract_int(approved_account, contract_template_id, None).await;
    ht_result_err_matches!(result, DeployContractError::InvalidApprovedAccount { .. });

    let approved_account = LedgerAccount::AccountIdentifier {
        slice: Principal::management_canister().as_slice().to_vec(),
    };
    let result = deploy_contract_int(approved_account, contract_template_id, None).await;
    ht_result_err_matches!(result, DeployContractError::InvalidApprovedAccount { .. });
}

#[tokio::test]
async fn test_deploy_contract_low_balance() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let contract_template_id =
        ht_add_contract(admin, contract_def, vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert_eq!(contract_template_id, 0);

    let approved_account = LedgerAccount::Account {
        owner: ht_get_test_user(),
        subaccount: None,
    };

    ht_set_test_caller(admin);
    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let config = Config {
        is_deployment_available: true,
        deployment_cycles_cost: 1_000_000_000,
        ..config.clone()
    };
    assert!(set_config_int(config.clone()).is_ok());

    let deployer = ht_get_test_user();
    ht_set_test_caller(deployer);

    let result = deploy_contract_int(approved_account.clone(), contract_template_id, None).await;
    ht_result_err_matches!(
        result,
        DeployContractError::InsufficientApprovedAccountBalance
    );
}

#[tokio::test]
async fn test_deploy_contract_low_allowance() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let contract_template_id =
        ht_add_contract(admin, contract_def, vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert_eq!(contract_template_id, 0);

    ht_set_test_caller(admin);
    let xdr_permyriad_per_icp = 20_000;
    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let config = Config {
        icp_xdr_conversion_rate_strategy: IcpXdrConversionRateStrategy::Fixed {
            xdr_permyriad_per_icp,
        },
        is_deployment_available: true,
        deployment_cycles_cost: 1_000_000_000,
        deployment_allowance_expiration_timeout: 60_000,
        ..config.clone()
    };
    assert!(set_config_int(config.clone()).is_ok());

    let deployer = ht_get_test_user();
    ht_set_test_caller(deployer);

    let contract_deployment_expenses_amount = ((TEST_CONTRACT_INITIAL_CYCLES
        + config.deployment_cycles_cost)
        / xdr_permyriad_per_icp as u128) as u64;

    let approved_account = LedgerAccount::Account {
        owner: ht_get_test_user(),
        subaccount: None,
    };
    let approved_account_identifier = to_account_identifier(&approved_account).unwrap();
    let approved_account_hex = approved_account_identifier.to_hex();
    // let expires_at = get_holder_model(|_, model| model.sale_deal.as_ref().unwrap().expiration_time);
    ht_approve_account(
        approved_account_hex.clone(),
        config.deployment_allowance_expiration_timeout,
        contract_deployment_expenses_amount - 1,
    );
    ht_deposit_account(
        &approved_account_identifier,
        contract_deployment_expenses_amount,
    );

    let result = deploy_contract_int(approved_account.clone(), contract_template_id, None).await;
    ht_result_err_matches!(
        result,
        DeployContractError::InsufficientApprovedAccountAllowance
    );
}

#[tokio::test]
async fn test_deploy_contract_allowance_expired() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let contract_template_id =
        ht_add_contract(admin, contract_def, vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert_eq!(contract_template_id, 0);

    ht_set_test_caller(admin);
    let xdr_permyriad_per_icp = 20_000;
    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let config = Config {
        icp_xdr_conversion_rate_strategy: IcpXdrConversionRateStrategy::Fixed {
            xdr_permyriad_per_icp,
        },
        is_deployment_available: true,
        deployment_cycles_cost: 1_000_000_000,
        deployment_allowance_expiration_timeout: 60_000,
        ..config.clone()
    };
    assert!(set_config_int(config.clone()).is_ok());

    let deployer = ht_get_test_user();
    ht_set_test_caller(deployer);

    let contract_deployment_expenses_amount = ((TEST_CONTRACT_INITIAL_CYCLES
        + config.deployment_cycles_cost)
        / xdr_permyriad_per_icp as u128) as u64;

    let approved_account = LedgerAccount::Account {
        owner: ht_get_test_user(),
        subaccount: None,
    };
    let approved_account_identifier = to_account_identifier(&approved_account).unwrap();
    let approved_account_hex = approved_account_identifier.to_hex();
    // let expires_at = get_holder_model(|_, model| model.sale_deal.as_ref().unwrap().expiration_time);
    ht_approve_account(
        approved_account_hex.clone(),
        config.deployment_allowance_expiration_timeout,
        contract_deployment_expenses_amount,
    );
    ht_deposit_account(
        &approved_account_identifier,
        contract_deployment_expenses_amount,
    );

    ht_set_test_time(1);

    let result = deploy_contract_int(approved_account.clone(), contract_template_id, None).await;
    ht_result_err_matches!(result, DeployContractError::AllowanceExpiresTooEarly);
}

#[tokio::test]
async fn test_cancel_deploy_contract() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let contract_template_id =
        ht_add_contract(admin, contract_def, vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert_eq!(contract_template_id, 0);

    ht_set_test_caller(admin);
    let xdr_permyriad_per_icp = 20_000;
    let cmc_canister = Principal::management_canister();
    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let config = Config {
        icp_xdr_conversion_rate_strategy: IcpXdrConversionRateStrategy::Fixed {
            xdr_permyriad_per_icp,
        },
        is_deployment_available: true,
        deployment_cycles_cost: 1_000_000_000,
        deployment_allowance_expiration_timeout: 60_000,
        contract_wasm_upload_chunk_size: 1000,
        cycles_converting_strategy: CyclesConvertingStrategy::CMCTopUp { cmc_canister },
        contract_canister_creation_strategy: CreateContractCanisterStrategy::OverCMC {
            cmc_canister,
        },
        ..config.clone()
    };
    assert!(set_config_int(config.clone()).is_ok());

    let deployer = ht_get_test_user();
    ht_set_test_caller(deployer);

    let contract_deployment_expenses_amount = ((TEST_CONTRACT_INITIAL_CYCLES
        + config.deployment_cycles_cost)
        / xdr_permyriad_per_icp as u128) as u64;

    let approved_account = LedgerAccount::Account {
        owner: ht_get_test_user(),
        subaccount: None,
    };
    let approved_account_identifier = to_account_identifier(&approved_account).unwrap();
    let approved_account_hex = approved_account_identifier.to_hex();
    ht_approve_account(
        approved_account_hex.clone(),
        config.deployment_allowance_expiration_timeout,
        contract_deployment_expenses_amount,
    );
    ht_deposit_account(
        &approved_account_identifier,
        contract_deployment_expenses_amount,
    );

    ht_set_test_time(0);

    let subnet_type = Some("main".to_string());
    let result = deploy_contract_int(
        approved_account.clone(),
        contract_template_id,
        subnet_type.clone(),
    )
    .await;
    assert!(result.is_ok());

    let deployment = result.unwrap().deployment;
    let deployment_id = deployment.deployment_id;
    assert_eq!(deployment_id, 0);
    assert_eq!(deployment.deployer, deployer);
    assert_eq!(deployment.contract_template_id, contract_template_id);
    assert_eq!(deployment.subnet_type, subnet_type);
    assert_eq!(deployment.need_processing, true);
    assert_eq!(deployment.approved_account, approved_account);
    assert_eq!(
        deployment.deployment_expenses.contract_initial_cycles,
        TEST_CONTRACT_INITIAL_CYCLES
    );
    assert_eq!(
        deployment.deployment_expenses.deployment_cycles_cost,
        config.deployment_cycles_cost
    );
    assert_eq!(
        deployment.expenses_amount,
        contract_deployment_expenses_amount
    );
    assert!(matches!(
        deployment.state,
        DeploymentState::TransferDeployerFundsToTransitAccount
    ));
    assert_eq!(
        ht_get_account_balance(approved_account_hex.clone()),
        contract_deployment_expenses_amount
    );

    // CANCEL FAIL PERMISSION DENIED
    ht_set_test_caller(Principal::anonymous());
    let result = cancel_deployment_int(deployment_id, "test".to_string()).await;
    ht_result_err_matches!(result, CancelDeploymentError::PermissionDenied);

    // CANCEL FAIL DEPLOYMENT NOT FOUND
    let result = cancel_deployment_int(deployment_id + 1, "test".to_string()).await;
    ht_result_err_matches!(result, CancelDeploymentError::DeploymentNotFound);

    ht_set_test_caller(deployer);

    let result = cancel_deployment_int(deployment_id, "test".to_string()).await;
    ht_result_err_matches!(result, CancelDeploymentError::DeploymentLocked { .. });

    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    let result = cancel_deployment_int(deployment_id, "test".to_string()).await;
    assert!(result.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::FinalizeDeployment {result, sub_state}
        if matches!(result, DeploymentResult::Cancelled {..}) && matches!(sub_state, FinalizeDeploymentState::Finalized)
    );

    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    let result = cancel_deployment_int(deployment_id, "test".to_string()).await;
    ht_result_err_matches!(result, CancelDeploymentError::DeploymentWrongState);

    // GET DEPLOYMENT INFORMATION
    let result = get_deployment_int(DeploymentFilter::Active { deployer });
    ht_result_err_matches!(result, GetDeploymentError::DeploymentNotFound);

    let result = get_deployment_int(DeploymentFilter::ByDeploymentId { deployment_id });
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_deploy_contract_with_cmc() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let wasm = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let contract_wasm_upload_chunk_size = 4;
    let contract_wasm_upload_chunk_count = wasm.len().div_ceil(contract_wasm_upload_chunk_size);

    let contract_template_id = ht_add_contract(admin, contract_def, wasm.clone());
    assert_eq!(contract_template_id, 0);

    ht_set_test_caller(admin);
    let deployment_fallback_account =
        AccountIdentifier::new(&Principal::management_canister(), &DEFAULT_SUBACCOUNT);
    let deployment_fallback_account_hex = deployment_fallback_account.to_hex();
    let xdr_permyriad_per_icp = 20_000;
    let cmc_canister = Principal::management_canister();
    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let config = Config {
        deployment_fallback_account_hex,
        icp_xdr_conversion_rate_strategy: IcpXdrConversionRateStrategy::Fixed {
            xdr_permyriad_per_icp,
        },
        is_deployment_available: true,
        deployment_cycles_cost: 1_000_000_000,
        deployment_allowance_expiration_timeout: 60_000,
        contract_wasm_upload_chunk_size,
        cycles_converting_strategy: CyclesConvertingStrategy::CMCTopUp { cmc_canister },
        contract_canister_creation_strategy: CreateContractCanisterStrategy::OverCMC {
            cmc_canister,
        },
        ..config.clone()
    };
    assert!(set_config_int(config.clone()).is_ok());

    let deployer = ht_get_test_user();
    ht_set_test_caller(deployer);

    let contract_deployment_expenses_amount = ((TEST_CONTRACT_INITIAL_CYCLES
        + config.deployment_cycles_cost)
        / xdr_permyriad_per_icp as u128) as u64;

    let approved_account = LedgerAccount::Account {
        owner: ht_get_test_user(),
        subaccount: None,
    };
    let approved_account_identifier = to_account_identifier(&approved_account).unwrap();
    let approved_account_hex = approved_account_identifier.to_hex();
    ht_approve_account(
        approved_account_hex.clone(),
        config.deployment_allowance_expiration_timeout,
        contract_deployment_expenses_amount,
    );
    ht_deposit_account(
        &approved_account_identifier,
        contract_deployment_expenses_amount,
    );

    ht_set_test_time(0);

    let subnet_type = Some("main".to_string());
    let result = deploy_contract_int(
        approved_account.clone(),
        contract_template_id,
        subnet_type.clone(),
    )
    .await;
    assert!(result.is_ok());

    let deployment = result.unwrap().deployment;
    let deployment_id = deployment.deployment_id;
    assert_eq!(deployment_id, 0);
    assert_eq!(deployment.deployer, deployer);
    assert_eq!(deployment.contract_template_id, contract_template_id);
    assert_eq!(deployment.subnet_type, subnet_type);
    assert_eq!(deployment.need_processing, true);
    assert_eq!(deployment.approved_account, approved_account);
    assert_eq!(
        deployment.deployment_expenses.contract_initial_cycles,
        TEST_CONTRACT_INITIAL_CYCLES
    );
    assert_eq!(
        deployment.deployment_expenses.deployment_cycles_cost,
        config.deployment_cycles_cost
    );
    assert_eq!(
        deployment.expenses_amount,
        contract_deployment_expenses_amount
    );
    assert!(matches!(
        deployment.state,
        DeploymentState::TransferDeployerFundsToTransitAccount
    ));
    assert_eq!(
        ht_get_account_balance(approved_account_hex.clone()),
        contract_deployment_expenses_amount
    );

    // CHECK ACTIVE DEPLOYMENT EXISTS
    let result = deploy_contract_int(approved_account, contract_template_id, None).await;
    ht_result_err_matches!(result, DeployContractError::ActiveDeploymentExists { .. });

    let env = get_env();

    // CHECK GET ACTIVATION CODE PERMISSION DENIED
    ht_set_test_caller(ht_get_test_admin());
    let result = get_contract_activation_code_int(deployment_id);
    ht_result_err_matches!(result, GetContractActivationCodeError::PermissionDenied);

    // CHECK GET ACTIVATION CODE DEPLOYMENT NOT FOUND
    ht_set_test_caller(deployer);
    let result = get_contract_activation_code_int(deployment_id + 1);
    ht_result_err_matches!(result, GetContractActivationCodeError::DeploymentNotFound);

    // CHECK GET ACTIVATION CODE
    ht_set_test_caller(deployer);
    let result = get_contract_activation_code_int(deployment_id);
    assert!(result.is_ok());

    // PROCESS DEPLOYMENT PERMISSION DENIED
    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    ht_set_test_caller(ht_get_test_admin());
    let result = process_deployment_int(deployment_id).await;
    ht_result_err_matches!(result, ProcessDeploymentError::PermissionDenied);

    // PROCESS DEPLOYMENT DEPLOYMENT NOT FOUND
    ht_set_test_caller(deployer);
    let result = process_deployment_int(deployment_id + 1).await;
    ht_result_err_matches!(result, ProcessDeploymentError::DeploymentNotFound);

    // PROCESS DEPLOYMENT TransferDeployerFundsToTransitAccount
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(&deployment_id, DeploymentState::TransferTopUpFundsToCMC);
    assert_eq!(ht_get_account_balance(approved_account_hex), 0);

    let transit_sub_account = get_deployment_transit_canister_sub_account(&deployment_id);
    let transit_balance = env
        .get_ledger()
        .get_canister_subaccount_balance(&transit_sub_account)
        .await
        .unwrap();
    assert_eq!(
        transit_balance,
        contract_deployment_expenses_amount - HT_LEDGER_FEE
    );

    // PROCESS DEPLOYMENT TransferTopUpFundsToCMC
    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(&deployment_id, DeploymentState::NotifyCMCTopUp { .. });

    let cmc = env.get_cmc();
    let cmc_receiver_account = AccountIdentifier::new(
        &cmc_canister,
        &cmc.get_canister_sub_account(env.get_ic().get_canister()),
    );
    let transit_balance = env
        .get_ledger()
        .get_canister_subaccount_balance(&transit_sub_account)
        .await
        .unwrap();
    assert_eq!(transit_balance, 0);
    assert_eq!(
        ht_get_account_balance(cmc_receiver_account.to_hex()),
        contract_deployment_expenses_amount - 2 * HT_LEDGER_FEE
    );

    // PROCESS DEPLOYMENT NotifyCMCTopUp
    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::CreateContractCanisterOverCMC
    );

    // PROCESS DEPLOYMENT CreateContractCanisterOverCMC
    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(&deployment_id, DeploymentState::GenerateContractCertificate);
    let contract_canister = read_state(|state| {
        state
            .get_model()
            .get_deployments_storage()
            .get_deployment(&deployment_id)
            .unwrap()
            .contract_canister
            .unwrap()
    });
    assert_eq!(contract_canister, ht_get_created_canister_over_cmc());

    // CHECK OBTAIN CERTIFICATE PERMISSION DENIED
    ht_set_test_caller(ht_get_test_admin());
    let result = obtain_contract_certificate_int(deployment_id);
    ht_result_err_matches!(result, ObtainContractCertificateError::PermissionDenied);

    // CHECK OBTAIN CERTIFICATE DEPLOYMENT NOT FOUND
    ht_set_test_caller(deployer);
    let result = obtain_contract_certificate_int(deployment_id + 1);
    ht_result_err_matches!(result, ObtainContractCertificateError::DeploymentNotFound);

    // CHECK OBTAIN CERTIFICATE WRONG
    let result = obtain_contract_certificate_int(deployment_id);
    ht_result_err_matches!(result, ObtainContractCertificateError::DeploymentWrongState);

    // PROCESS DEPLOYMENT GenerateContractCertificate
    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::WaitingReceiveContractCertificate
    );

    // GET ACTIVE DEPLOYMENT INFORMATION
    let result = get_deployment_int(DeploymentFilter::Active { deployer }).unwrap();
    matches!(result, GetDeploymentResult { deployment }
        if deployment.deployment_id == deployment_id);

    // CHECK OBTAIN CERTIFICATE
    let result = obtain_contract_certificate_int(deployment_id);
    assert!(result.is_ok());
    let certificate = result.unwrap().certificate;

    // INITIALIZE CERTIFICATE FAIL PERMISSION DENIED
    ht_set_test_caller(Principal::anonymous());
    let result = initialize_contract_certificate_int(deployment_id, certificate.clone()).await;
    ht_result_err_matches!(result, InitializeContractCertificateError::PermissionDenied);

    // INITIALIZE CERTIFICATE FAIL DEPLOYMENT NOT FOUND
    let result = initialize_contract_certificate_int(deployment_id + 1, certificate.clone()).await;
    ht_result_err_matches!(
        result,
        InitializeContractCertificateError::DeploymentNotFound
    );

    // INITIALIZE CERTIFICATE FAIL WRONG CERTIFICATE
    ht_set_test_caller(deployer);
    let mut wrong_certificate = certificate.clone();
    wrong_certificate.signature[0] ^= 0xFF;
    let result = initialize_contract_certificate_int(deployment_id, wrong_certificate).await;
    ht_result_err_matches!(
        result,
        InitializeContractCertificateError::InvalidCertificate { .. }
    );

    // INITIALIZE CERTIFICATE
    let result = initialize_contract_certificate_int(deployment_id, certificate.clone()).await;
    assert!(result.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::UploadContractWasm {
            certificate: install_certificate,
            uploaded_chunk_hashes,
            upload_chunk_size,
            upload_chunk_count
        }
     if install_certificate == &certificate && uploaded_chunk_hashes.is_empty() && upload_chunk_size == &contract_wasm_upload_chunk_size && upload_chunk_count == &contract_wasm_upload_chunk_count);

    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::UploadContractWasm {
            certificate: install_certificate,
            uploaded_chunk_hashes,
            upload_chunk_size,
            upload_chunk_count
        }
     if install_certificate == &certificate && uploaded_chunk_hashes.len() == 1 && upload_chunk_size == &contract_wasm_upload_chunk_size && upload_chunk_count == &contract_wasm_upload_chunk_count);

    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::UploadContractWasm {
            certificate: install_certificate,
            uploaded_chunk_hashes,
            upload_chunk_size,
            upload_chunk_count
        }
     if install_certificate == &certificate && uploaded_chunk_hashes.len() == 2 && upload_chunk_size == &contract_wasm_upload_chunk_size && upload_chunk_count == &contract_wasm_upload_chunk_count);

    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::UploadContractWasm {
            certificate: install_certificate,
            uploaded_chunk_hashes,
            upload_chunk_size,
            upload_chunk_count
        }
     if install_certificate == &certificate && uploaded_chunk_hashes.len() == 3 && upload_chunk_size == &contract_wasm_upload_chunk_size && upload_chunk_count == &contract_wasm_upload_chunk_count);

    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::InstallContractWasm {
            certificate: install_certificate,
            uploaded_chunk_hashes,
        }
    if install_certificate == &certificate  && uploaded_chunk_hashes.len() == 3 );

    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(&deployment_id, DeploymentState::MakeContractSelfControlled);

    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::FinalizeDeployment {
            result: DeploymentResult::Success,
            sub_state: FinalizeDeploymentState::StartDeploymentFinalization
        }
    );

    let result = process_deployment_int(deployment_id).await;
    assert!(result.is_ok());

    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::FinalizeDeployment {
            result: DeploymentResult::Success,
            sub_state: FinalizeDeploymentState::Finalized
        }
    );

    assert_eq!(
        env.get_ledger()
            .get_account_balance(deployment_fallback_account)
            .await
            .unwrap(),
        0
    );
}

#[tokio::test]
async fn test_deploy_contract_without_cmc() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let wasm = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let contract_wasm_upload_chunk_size = 4;
    let contract_wasm_upload_chunk_count = wasm.len().div_ceil(contract_wasm_upload_chunk_size);

    let contract_template_id = ht_add_contract(admin, contract_def, wasm.clone());
    assert_eq!(contract_template_id, 0);

    ht_set_test_caller(admin);
    let deployment_fallback_account =
        AccountIdentifier::new(&Principal::management_canister(), &DEFAULT_SUBACCOUNT);
    let deployment_fallback_account_hex = deployment_fallback_account.to_hex();
    let xdr_permyriad_per_icp = 20_000;
    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let config = Config {
        deployment_fallback_account_hex,
        icp_xdr_conversion_rate_strategy: IcpXdrConversionRateStrategy::Fixed {
            xdr_permyriad_per_icp,
        },
        is_deployment_available: true,
        deployment_cycles_cost: 1_000_000_000,
        deployment_allowance_expiration_timeout: 60_000,
        contract_wasm_upload_chunk_size,
        cycles_converting_strategy: CyclesConvertingStrategy::Skip,
        contract_canister_creation_strategy: CreateContractCanisterStrategy::OverManagementCanister,
        ..config.clone()
    };
    assert!(set_config_int(config.clone()).is_ok());

    let deployer = ht_get_test_user();
    ht_set_test_caller(deployer);

    let contract_deployment_expenses_amount = ((TEST_CONTRACT_INITIAL_CYCLES
        + config.deployment_cycles_cost)
        / xdr_permyriad_per_icp as u128) as u64;

    let approved_account = LedgerAccount::Account {
        owner: ht_get_test_user(),
        subaccount: None,
    };
    let approved_account_identifier = to_account_identifier(&approved_account).unwrap();
    let approved_account_hex = approved_account_identifier.to_hex();
    ht_approve_account(
        approved_account_hex.clone(),
        config.deployment_allowance_expiration_timeout,
        contract_deployment_expenses_amount,
    );
    ht_deposit_account(
        &approved_account_identifier,
        contract_deployment_expenses_amount,
    );

    ht_set_test_time(0);

    let subnet_type = Some("main".to_string());
    let result = deploy_contract_int(
        approved_account.clone(),
        contract_template_id,
        subnet_type.clone(),
    )
    .await;
    assert!(result.is_ok());

    let deployment = result.unwrap().deployment;
    let deployment_id = deployment.deployment_id;
    assert_eq!(deployment_id, 0);
    assert_eq!(deployment.deployer, deployer);
    assert_eq!(deployment.contract_template_id, contract_template_id);
    assert_eq!(deployment.subnet_type, subnet_type);
    assert_eq!(deployment.need_processing, true);
    assert_eq!(deployment.approved_account, approved_account);
    assert_eq!(
        deployment.deployment_expenses.contract_initial_cycles,
        TEST_CONTRACT_INITIAL_CYCLES
    );
    assert_eq!(
        deployment.deployment_expenses.deployment_cycles_cost,
        config.deployment_cycles_cost
    );
    assert_eq!(
        deployment.expenses_amount,
        contract_deployment_expenses_amount
    );
    assert!(matches!(
        deployment.state,
        DeploymentState::TransferDeployerFundsToTransitAccount
    ));
    assert_eq!(
        ht_get_account_balance(approved_account_hex.clone()),
        contract_deployment_expenses_amount
    );

    // CHECK ACTIVE DEPLOYMENT EXISTS
    let result = deploy_contract_int(approved_account, contract_template_id, None).await;
    ht_result_err_matches!(result, DeployContractError::ActiveDeploymentExists { .. });

    let env = get_env();

    // CHECK GET ACTIVATION CODE PERMISSION DENIED
    ht_set_test_caller(ht_get_test_admin());
    let result = get_contract_activation_code_int(deployment_id);
    ht_result_err_matches!(result, GetContractActivationCodeError::PermissionDenied);

    // CHECK GET ACTIVATION CODE DEPLOYMENT NOT FOUND
    ht_set_test_caller(deployer);
    let result = get_contract_activation_code_int(deployment_id + 1);
    ht_result_err_matches!(result, GetContractActivationCodeError::DeploymentNotFound);

    // CHECK GET ACTIVATION CODE
    ht_set_test_caller(deployer);
    let result = get_contract_activation_code_int(deployment_id);
    assert!(result.is_ok());

    // PROCESS DEPLOYMENT PERMISSION DENIED
    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    ht_set_test_caller(ht_get_test_admin());
    let result = process_deployment_int(deployment_id).await;
    ht_result_err_matches!(result, ProcessDeploymentError::PermissionDenied);

    // PROCESS DEPLOYMENT DEPLOYMENT NOT FOUND
    ht_set_test_caller(deployer);
    let result = process_deployment_int(deployment_id + 1).await;
    ht_result_err_matches!(result, ProcessDeploymentError::DeploymentNotFound);

    // PROCESS DEPLOYMENT TransferDeployerFundsToTransitAccount
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(&deployment_id, DeploymentState::TransferTopUpFundsToCMC);

    assert_eq!(ht_get_account_balance(approved_account_hex), 0);
    let transit_sub_account = get_deployment_transit_canister_sub_account(&deployment_id);
    let transit_balance = env
        .get_ledger()
        .get_canister_subaccount_balance(&transit_sub_account)
        .await
        .unwrap();
    assert_eq!(
        transit_balance,
        contract_deployment_expenses_amount - HT_LEDGER_FEE
    );

    // PROCESS DEPLOYMENT TransferTopUpFundsToCMC
    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(&deployment_id, DeploymentState::GenerateContractCertificate);

    let contract_canister = read_state(|state| {
        state
            .get_model()
            .get_deployments_storage()
            .get_deployment(&deployment_id)
            .unwrap()
            .contract_canister
            .unwrap()
    });
    assert_eq!(contract_canister, ht_get_created_canister_over_cmc());

    // CHECK OBTAIN CERTIFICATE PERMISSION DENIED
    ht_set_test_caller(ht_get_test_admin());
    let result = obtain_contract_certificate_int(deployment_id);
    ht_result_err_matches!(result, ObtainContractCertificateError::PermissionDenied);

    // CHECK OBTAIN CERTIFICATE DEPLOYMENT NOT FOUND
    ht_set_test_caller(deployer);
    let result = obtain_contract_certificate_int(deployment_id + 1);
    ht_result_err_matches!(result, ObtainContractCertificateError::DeploymentNotFound);

    // CHECK OBTAIN CERTIFICATE WRONG
    let result = obtain_contract_certificate_int(deployment_id);
    ht_result_err_matches!(result, ObtainContractCertificateError::DeploymentWrongState);

    // PROCESS DEPLOYMENT GenerateContractCertificate
    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::WaitingReceiveContractCertificate
    );

    // GET ACTIVE DEPLOYMENT INFORMATION
    let result = get_deployment_int(DeploymentFilter::Active { deployer }).unwrap();
    matches!(result, GetDeploymentResult { deployment }
        if deployment.deployment_id == deployment_id);

    // CHECK OBTAIN CERTIFICATE
    let result = obtain_contract_certificate_int(deployment_id);
    assert!(result.is_ok());
    let certificate = result.unwrap().certificate;

    // INITIALIZE CERTIFICATE FAIL PERMISSION DENIED
    ht_set_test_caller(Principal::anonymous());
    let result = initialize_contract_certificate_int(deployment_id, certificate.clone()).await;
    ht_result_err_matches!(result, InitializeContractCertificateError::PermissionDenied);

    // INITIALIZE CERTIFICATE FAIL DEPLOYMENT NOT FOUND
    let result = initialize_contract_certificate_int(deployment_id + 1, certificate.clone()).await;
    ht_result_err_matches!(
        result,
        InitializeContractCertificateError::DeploymentNotFound
    );

    // INITIALIZE CERTIFICATE FAIL WRONG CERTIFICATE
    ht_set_test_caller(deployer);
    let mut wrong_certificate = certificate.clone();
    wrong_certificate.signature[0] ^= 0xFF;
    let result = initialize_contract_certificate_int(deployment_id, wrong_certificate).await;
    ht_result_err_matches!(
        result,
        InitializeContractCertificateError::InvalidCertificate { .. }
    );

    // INITIALIZE CERTIFICATE
    let result = initialize_contract_certificate_int(deployment_id, certificate.clone()).await;
    assert!(result.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::UploadContractWasm {
            certificate: install_certificate,
            uploaded_chunk_hashes,
            upload_chunk_size,
            upload_chunk_count
        }
     if install_certificate == &certificate && uploaded_chunk_hashes.is_empty() && upload_chunk_size == &contract_wasm_upload_chunk_size && upload_chunk_count == &contract_wasm_upload_chunk_count);

    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::UploadContractWasm {
            certificate: install_certificate,
            uploaded_chunk_hashes,
            upload_chunk_size,
            upload_chunk_count
        }
     if install_certificate == &certificate && uploaded_chunk_hashes.len() == 1 && upload_chunk_size == &contract_wasm_upload_chunk_size && upload_chunk_count == &contract_wasm_upload_chunk_count);

    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::UploadContractWasm {
            certificate: install_certificate,
            uploaded_chunk_hashes,
            upload_chunk_size,
            upload_chunk_count
        }
     if install_certificate == &certificate && uploaded_chunk_hashes.len() == 2 && upload_chunk_size == &contract_wasm_upload_chunk_size && upload_chunk_count == &contract_wasm_upload_chunk_count);

    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::UploadContractWasm {
            certificate: install_certificate,
            uploaded_chunk_hashes,
            upload_chunk_size,
            upload_chunk_count
        }
     if install_certificate == &certificate && uploaded_chunk_hashes.len() == 3 && upload_chunk_size == &contract_wasm_upload_chunk_size && upload_chunk_count == &contract_wasm_upload_chunk_count);

    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::InstallContractWasm {
            certificate: install_certificate,
            uploaded_chunk_hashes,
        }
    if install_certificate == &certificate  && uploaded_chunk_hashes.len() == 3 );

    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(&deployment_id, DeploymentState::MakeContractSelfControlled);

    ht_set_test_time(get_deployment_lock_expiration(&deployment_id));
    assert!(process_deployment_int(deployment_id).await.is_ok());
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::FinalizeDeployment {
            result: DeploymentResult::Success,
            sub_state: FinalizeDeploymentState::StartDeploymentFinalization
        }
    );

    assert_eq!(
        env.get_ledger()
            .get_canister_subaccount_balance(&transit_sub_account)
            .await
            .unwrap(),
        contract_deployment_expenses_amount - HT_LEDGER_FEE
    );

    let result = process_deployment_int(deployment_id).await;
    assert!(result.is_ok());

    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::FinalizeDeployment {
            result: DeploymentResult::Success,
            sub_state: FinalizeDeploymentState::Finalized
        }
    );

    assert_eq!(
        env.get_ledger()
            .get_canister_subaccount_balance(&transit_sub_account)
            .await
            .unwrap(),
        0
    );

    assert_eq!(
        env.get_ledger()
            .get_account_balance(deployment_fallback_account)
            .await
            .unwrap(),
        contract_deployment_expenses_amount - 2 * HT_LEDGER_FEE
    );
}

#[tokio::test]
async fn test_deploy_contract_with_after_buffer() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let contract_template_id =
        ht_add_contract(admin, contract_def, vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert_eq!(contract_template_id, 0);

    ht_set_test_caller(admin);
    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let cmc_canister = Principal::management_canister();
    let xdr_permyriad_per_icp = 20_000;
    let config = Config {
        contract_wasm_upload_chunk_size: 1000,
        is_deployment_available: true,
        icp_xdr_conversion_rate_strategy: IcpXdrConversionRateStrategy::Fixed {
            xdr_permyriad_per_icp,
        },
        cycles_converting_strategy: CyclesConvertingStrategy::CMCTopUp { cmc_canister },
        contract_canister_creation_strategy: CreateContractCanisterStrategy::OverCMC {
            cmc_canister,
        },
        deployment_allowance_expiration_timeout: 60_000,
        deployment_cycles_cost: 1_000_000_000,
        deployment_expenses_amount_buffer_permyriad: 3333,
        deployment_expenses_amount_decimal_places: 6,
        ..config.clone()
    };
    assert!(set_config_int(config.clone()).is_ok());

    let contract_deployment_expenses_amount = ((TEST_CONTRACT_INITIAL_CYCLES
        + config.deployment_cycles_cost)
        / xdr_permyriad_per_icp as u128) as u64;

    let deployer = ht_get_test_user();
    ht_set_test_caller(deployer);

    let approved_account = LedgerAccount::Account {
        owner: ht_get_test_user(),
        subaccount: None,
    };
    let approved_account_identifier = to_account_identifier(&approved_account).unwrap();
    let approved_account_hex = approved_account_identifier.to_hex();

    // DEPOSIT FUNDS TO WALLET ACCOUNT
    let buffer_amount = round_e8s_ceil(
        contract_deployment_expenses_amount as u128
            + (contract_deployment_expenses_amount as u128
                * config.deployment_expenses_amount_buffer_permyriad as u128)
                / 10_000,
        config.deployment_expenses_amount_decimal_places,
    )
    .unwrap() as u64;

    ht_approve_account(
        approved_account_hex.clone(),
        config.deployment_allowance_expiration_timeout,
        buffer_amount + 3,
    );
    ht_deposit_account(&approved_account_identifier, buffer_amount + 2);

    let result = deploy_contract_int(approved_account.clone(), contract_template_id, None).await;
    assert!(result.is_ok());
    let deployment = result.unwrap().deployment;
    let deployment_id = deployment.deployment_id;
    assert_eq!(deployment_id, 0);
    assert_eq!(deployment.deployer, deployer);
    assert_eq!(deployment.contract_template_id, contract_template_id);
    assert_eq!(deployment.subnet_type, None);
    assert_eq!(deployment.need_processing, true);
    assert_eq!(
        deployment.deployment_expenses.contract_initial_cycles,
        TEST_CONTRACT_INITIAL_CYCLES
    );
    assert_eq!(
        deployment.deployment_expenses.deployment_cycles_cost,
        config.deployment_cycles_cost
    );
    assert_eq!(deployment.expenses_amount, buffer_amount);
    assert!(matches!(
        deployment.state,
        DeploymentState::TransferDeployerFundsToTransitAccount
    ));
    assert_eq!(
        ht_get_account_balance(approved_account_hex),
        buffer_amount + 2
    );
}

#[tokio::test]
async fn test_deploy_contract_with_before_buffer() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let contract_template_id =
        ht_add_contract(admin, contract_def, vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert_eq!(contract_template_id, 0);

    ht_set_test_caller(admin);
    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let cmc_canister = Principal::management_canister();
    let xdr_permyriad_per_icp = 20_000;
    let config = Config {
        contract_wasm_upload_chunk_size: 1000,
        is_deployment_available: true,
        icp_xdr_conversion_rate_strategy: IcpXdrConversionRateStrategy::Fixed {
            xdr_permyriad_per_icp,
        },
        cycles_converting_strategy: CyclesConvertingStrategy::CMCTopUp { cmc_canister },
        contract_canister_creation_strategy: CreateContractCanisterStrategy::OverCMC {
            cmc_canister,
        },
        deployment_allowance_expiration_timeout: 60_000,
        deployment_cycles_cost: 1_000_000_000,
        deployment_expenses_amount_buffer_permyriad: 3333,
        deployment_expenses_amount_decimal_places: 6,
        ..config.clone()
    };
    assert!(set_config_int(config.clone()).is_ok());

    let contract_deployment_expenses_amount = ((TEST_CONTRACT_INITIAL_CYCLES
        + config.deployment_cycles_cost)
        / xdr_permyriad_per_icp as u128) as u64;

    let buffer_amount = round_e8s_ceil(
        contract_deployment_expenses_amount as u128
            + (contract_deployment_expenses_amount as u128
                * config.deployment_expenses_amount_buffer_permyriad as u128)
                / 10_000,
        config.deployment_expenses_amount_decimal_places,
    )
    .unwrap() as u64;

    assert!(contract_deployment_expenses_amount < buffer_amount);

    let approved_account = LedgerAccount::Account {
        owner: ht_get_test_user(),
        subaccount: None,
    };
    let approved_account_identifier = to_account_identifier(&approved_account).unwrap();
    let approved_account_hex = approved_account_identifier.to_hex();

    ht_approve_account(
        approved_account_hex.clone(),
        config.deployment_allowance_expiration_timeout,
        buffer_amount - 4,
    );
    ht_deposit_account(&approved_account_identifier, buffer_amount - 3);

    let deployer = ht_get_test_user();
    ht_set_test_caller(deployer);

    let result = deploy_contract_int(approved_account, contract_template_id, None).await;
    assert!(result.is_ok());
    let deployment = result.unwrap().deployment;
    let deployment_id = deployment.deployment_id;
    assert_eq!(deployment_id, 0);
    assert_eq!(deployment.deployer, deployer);
    assert_eq!(deployment.contract_template_id, contract_template_id);
    assert_eq!(deployment.subnet_type, None);
    assert_eq!(deployment.need_processing, true);
    assert_eq!(
        deployment.deployment_expenses.contract_initial_cycles,
        TEST_CONTRACT_INITIAL_CYCLES
    );
    assert_eq!(
        deployment.deployment_expenses.deployment_cycles_cost,
        config.deployment_cycles_cost
    );
    assert_eq!(deployment.expenses_amount, buffer_amount - 4);
    assert!(matches!(
        deployment.state,
        DeploymentState::TransferDeployerFundsToTransitAccount
    ));
    assert_eq!(
        ht_get_account_balance(approved_account_hex),
        buffer_amount - 3
    );
}

#[tokio::test]
async fn test_deploy_contract_template_retired() {
    let admin = ht_get_test_admin();
    let contract_def = ht_get_face_contract_def();

    let contract_template_id =
        ht_add_contract(admin, contract_def, vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert_eq!(contract_template_id, 0);

    let approved_account = LedgerAccount::Account {
        owner: ht_get_test_user(),
        subaccount: None,
    };

    // Enable deployment and grant RetireContractTemplate permission
    ht_set_test_caller(admin);
    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let config = Config {
        is_deployment_available: true,
        ..config.clone()
    };
    assert!(set_config_int(config).is_ok());

    let result = set_access_rights_int(vec![AccessRight {
        caller: admin,
        permissions: Some(vec![
            Permission::SetAccessRights,
            Permission::RetireContractTemplate,
        ]),
        description: None,
    }]);
    assert!(result.is_ok());

    // Retire the template
    let result = set_contract_template_retired_int(
        contract_template_id,
        Some("no longer supported".to_string()),
    );
    assert!(result.is_ok());

    // Deploy must fail with ContractTemplateRetired
    let deployer = ht_get_test_user();
    ht_set_test_caller(deployer);
    let result = deploy_contract_int(approved_account.clone(), contract_template_id, None).await;
    ht_result_err_matches!(result, DeployContractError::ContractTemplateRetired);

    // Unretire the template
    ht_set_test_caller(admin);
    let result = set_contract_template_retired_int(contract_template_id, None);
    assert!(result.is_ok());

    // After unretire — deploy proceeds past the template check (fails on balance, not on template)
    ht_set_test_caller(deployer);
    let result = deploy_contract_int(approved_account.clone(), contract_template_id, None).await;
    ht_result_err_matches!(
        result,
        DeployContractError::InsufficientApprovedAccountBalance
    );
}

fn get_deployment_lock_expiration(deployment_id: &DeploymentId) -> TimestampMillis {
    read_state(|state| {
        state
            .get_model()
            .get_deployments_storage()
            .get_deployment(deployment_id)
            .unwrap()
            .lock
            .as_ref()
            .unwrap()
            .expiration
    })
}
