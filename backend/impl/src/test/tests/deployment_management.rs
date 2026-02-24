use crate::{
    get_env,
    handlers::wallet::get_deployment_transit_canister_sub_account,
    ht_deployment_state_matches, ht_result_err_matches,
    queries::{
        get_contract_activation_code::get_contract_activation_code_int,
        get_deployment::get_deployment_int,
    },
    read_state,
    test::tests::{
        components::{
            cmc::ht_get_created_canister_over_cmc,
            ic::ht_set_test_caller,
            ledger::{ht_get_account_balance, HT_LEDGER_FEE},
            time::ht_set_test_time,
        },
        drivers::{
            contract::ht_add_contract,
            deployment::{
                get_deployment_lock_expiration, ht_assert_certificate_errors_and_initialize,
                ht_assert_deploying_result, ht_assert_process_deployment_errors,
                ht_calc_expenses_amount, ht_calc_expenses_amount_buffered, ht_drive_to_deploying,
                ht_fund_deployer_account, ht_setup_deployment_config, DeploymentConfig,
            },
        },
        ht_get_test_admin, ht_get_test_user,
        support::fixtures::{
            ht_get_face_contract_def, TEST_CONTRACT_INITIAL_CYCLES, TEST_DEPLOYMENT_CYCLES_COST,
            TEST_WASM,
        },
    },
    updates::{
        cancel_deployment::cancel_deployment_int, deploy_contract::deploy_contract_int,
        process_deployment::process_deployment_int, set_access_rights::set_access_rights_int,
        set_contract_template_retired::set_contract_template_retired_int,
    },
};
use candid::Principal;
use common_canister_types::LedgerAccount;
use hub_canister_api::{
    cancel_deployment::CancelDeploymentError,
    deploy_contract::DeployContractError,
    get_contract_activation_code::GetContractActivationCodeError,
    get_deployment::{DeploymentFilter, GetDeploymentError, GetDeploymentResult},
    types::{
        AccessRight, CreateContractCanisterStrategy, CyclesConvertingStrategy, DeploymentResult,
        DeploymentState, FinalizeDeploymentState, Permission,
    },
};
use ic_ledger_types::{AccountIdentifier, DEFAULT_SUBACCOUNT};

#[tokio::test]
async fn test_deploy_contract_caller_not_authorized() {
    let admin = ht_get_test_admin();

    let contract_template_id =
        ht_add_contract(admin, ht_get_face_contract_def(), TEST_WASM.to_vec());
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

    let contract_template_id =
        ht_add_contract(admin, ht_get_face_contract_def(), TEST_WASM.to_vec());
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

    let contract_template_id =
        ht_add_contract(admin, ht_get_face_contract_def(), TEST_WASM.to_vec());
    assert_eq!(contract_template_id, 0);

    let approved_account = LedgerAccount::Account {
        owner: ht_get_test_user(),
        subaccount: None,
    };

    // Enable deployment
    ht_setup_deployment_config(admin, &DeploymentConfig::default());

    ht_set_test_caller(ht_get_test_user());
    let result =
        deploy_contract_int(approved_account.clone(), contract_template_id + 1, None).await;
    ht_result_err_matches!(result, DeployContractError::ContractTemplateNotFound);
}

#[tokio::test]
async fn test_deploy_contract_invalid_approved_account() {
    let admin = ht_get_test_admin();

    let contract_template_id =
        ht_add_contract(admin, ht_get_face_contract_def(), TEST_WASM.to_vec());
    assert_eq!(contract_template_id, 0);

    // Enable deployment
    ht_setup_deployment_config(admin, &DeploymentConfig::default());

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

    let contract_template_id =
        ht_add_contract(admin, ht_get_face_contract_def(), TEST_WASM.to_vec());
    assert_eq!(contract_template_id, 0);

    // Enable deployment with a non-zero cycles cost so balance check triggers
    ht_setup_deployment_config(
        admin,
        &DeploymentConfig {
            deployment_cycles_cost: TEST_DEPLOYMENT_CYCLES_COST,
            ..DeploymentConfig::default()
        },
    );

    let deployer = ht_get_test_user();
    ht_set_test_caller(deployer);

    let approved_account = LedgerAccount::Account {
        owner: deployer,
        subaccount: None,
    };
    // No funds deposited — balance is zero
    let result = deploy_contract_int(approved_account.clone(), contract_template_id, None).await;
    ht_result_err_matches!(
        result,
        DeployContractError::InsufficientApprovedAccountBalance
    );
}

#[tokio::test]
async fn test_deploy_contract_low_allowance() {
    let admin = ht_get_test_admin();

    let contract_template_id =
        ht_add_contract(admin, ht_get_face_contract_def(), TEST_WASM.to_vec());
    assert_eq!(contract_template_id, 0);

    let deployment_cfg = DeploymentConfig::default();
    ht_setup_deployment_config(admin, &deployment_cfg);

    let deployer = ht_get_test_user();
    ht_set_test_caller(deployer);

    let expenses_amount = ht_calc_expenses_amount(&deployment_cfg, TEST_CONTRACT_INITIAL_CYCLES);

    // Allowance is 1 less than required — should trigger InsufficientApprovedAccountAllowance
    let (approved_account, _) = ht_fund_deployer_account(
        deployer,
        expenses_amount - 1,
        expenses_amount,
        deployment_cfg.deployment_allowance_expiration_timeout,
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

    let contract_template_id =
        ht_add_contract(admin, ht_get_face_contract_def(), TEST_WASM.to_vec());
    assert_eq!(contract_template_id, 0);

    let deployment_cfg = DeploymentConfig::default();
    ht_setup_deployment_config(admin, &deployment_cfg);

    let deployer = ht_get_test_user();
    ht_set_test_caller(deployer);

    let expenses_amount = ht_calc_expenses_amount(&deployment_cfg, TEST_CONTRACT_INITIAL_CYCLES);

    let (approved_account, _) = ht_fund_deployer_account(
        deployer,
        expenses_amount,
        expenses_amount,
        deployment_cfg.deployment_allowance_expiration_timeout,
    );

    // Advance time past the allowance expiration window — should trigger AllowanceExpiresTooEarly
    ht_set_test_time(1);

    let result = deploy_contract_int(approved_account.clone(), contract_template_id, None).await;
    ht_result_err_matches!(result, DeployContractError::AllowanceExpiresTooEarly);
}

#[tokio::test]
async fn test_cancel_deploy_contract() {
    let admin = ht_get_test_admin();
    let deployer = ht_get_test_user();

    let contract_template_id =
        ht_add_contract(admin, ht_get_face_contract_def(), TEST_WASM.to_vec());
    assert_eq!(contract_template_id, 0);

    let subnet_type = Some("main".to_string());
    let dr = ht_drive_to_deploying(
        admin,
        deployer,
        contract_template_id,
        &DeploymentConfig::default(),
        TEST_CONTRACT_INITIAL_CYCLES,
        subnet_type.clone(),
    )
    .await;

    let deployment_id = dr.deployment_id;
    let approved_account_hex = dr.approved_account_identifier.to_hex();

    ht_assert_deploying_result(
        &dr,
        contract_template_id,
        subnet_type.clone(),
        TEST_CONTRACT_INITIAL_CYCLES,
        &approved_account_hex,
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
    let deployer = ht_get_test_user();

    let wasm = TEST_WASM.to_vec();
    let contract_wasm_upload_chunk_size = 4;
    let contract_wasm_upload_chunk_count = wasm.len().div_ceil(contract_wasm_upload_chunk_size);

    let contract_template_id = ht_add_contract(admin, ht_get_face_contract_def(), wasm);
    assert_eq!(contract_template_id, 0);

    let deployment_cfg = DeploymentConfig {
        contract_wasm_upload_chunk_size,
        ..DeploymentConfig::default()
    };

    let subnet_type = Some("main".to_string());
    let dr = ht_drive_to_deploying(
        admin,
        deployer,
        contract_template_id,
        &deployment_cfg,
        TEST_CONTRACT_INITIAL_CYCLES,
        subnet_type.clone(),
    )
    .await;

    let deployment_id = dr.deployment_id;
    let approved_account = dr.approved_account.clone();
    let approved_account_identifier = dr.approved_account_identifier;
    let approved_account_hex = approved_account_identifier.to_hex();
    let contract_deployment_expenses_amount = dr.expenses_amount;
    let cmc_canister = Principal::management_canister();
    let deployment_fallback_account =
        AccountIdentifier::new(&Principal::management_canister(), &DEFAULT_SUBACCOUNT);

    ht_assert_deploying_result(
        &dr,
        contract_template_id,
        subnet_type.clone(),
        TEST_CONTRACT_INITIAL_CYCLES,
        &approved_account_hex,
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

    ht_assert_process_deployment_errors(ht_get_test_admin(), deployer, &deployment_id).await;

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

    // GET ACTIVE DEPLOYMENT INFORMATION (checked before certificate errors to verify state)
    let result = get_deployment_int(DeploymentFilter::Active { deployer }).unwrap();
    matches!(result, GetDeploymentResult { deployment }
        if deployment.deployment_id == deployment_id);

    // Assert certificate errors and perform the happy-path initialize (advances to UploadContractWasm)
    let certificate =
        ht_assert_certificate_errors_and_initialize(ht_get_test_admin(), deployer, &deployment_id)
            .await;

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
    let deployer = ht_get_test_user();

    let wasm = TEST_WASM.to_vec();
    let contract_wasm_upload_chunk_size = 4;
    let contract_wasm_upload_chunk_count = wasm.len().div_ceil(contract_wasm_upload_chunk_size);

    let contract_template_id = ht_add_contract(admin, ht_get_face_contract_def(), wasm);
    assert_eq!(contract_template_id, 0);

    let deployment_cfg = DeploymentConfig {
        contract_wasm_upload_chunk_size,
        cycles_converting_strategy: CyclesConvertingStrategy::Skip,
        contract_canister_creation_strategy: CreateContractCanisterStrategy::OverManagementCanister,
        ..DeploymentConfig::default()
    };

    let subnet_type = Some("main".to_string());
    let dr = ht_drive_to_deploying(
        admin,
        deployer,
        contract_template_id,
        &deployment_cfg,
        TEST_CONTRACT_INITIAL_CYCLES,
        subnet_type.clone(),
    )
    .await;

    let deployment_id = dr.deployment_id;
    let approved_account = dr.approved_account.clone();
    let approved_account_identifier = dr.approved_account_identifier;
    let approved_account_hex = approved_account_identifier.to_hex();
    let contract_deployment_expenses_amount = dr.expenses_amount;
    let deployment_fallback_account =
        AccountIdentifier::new(&Principal::management_canister(), &DEFAULT_SUBACCOUNT);

    ht_assert_deploying_result(
        &dr,
        contract_template_id,
        subnet_type.clone(),
        TEST_CONTRACT_INITIAL_CYCLES,
        &approved_account_hex,
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

    ht_assert_process_deployment_errors(ht_get_test_admin(), deployer, &deployment_id).await;

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

    // GET ACTIVE DEPLOYMENT INFORMATION (checked before certificate errors to verify state)
    let result = get_deployment_int(DeploymentFilter::Active { deployer }).unwrap();
    matches!(result, GetDeploymentResult { deployment }
        if deployment.deployment_id == deployment_id);

    // Assert certificate errors and perform the happy-path initialize (advances to UploadContractWasm)
    let certificate =
        ht_assert_certificate_errors_and_initialize(ht_get_test_admin(), deployer, &deployment_id)
            .await;
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
    let deployer = ht_get_test_user();

    let contract_template_id =
        ht_add_contract(admin, ht_get_face_contract_def(), TEST_WASM.to_vec());
    assert_eq!(contract_template_id, 0);

    let deployment_cfg = DeploymentConfig {
        deployment_expenses_amount_buffer_permyriad: 3333,
        deployment_expenses_amount_decimal_places: 6,
        ..DeploymentConfig::default()
    };

    // Configure hub (without deploying yet so we can fund with custom amounts)
    ht_setup_deployment_config(admin, &deployment_cfg);

    let buffer_amount =
        ht_calc_expenses_amount_buffered(&deployment_cfg, TEST_CONTRACT_INITIAL_CYCLES);

    // Fund with slightly more than the buffer so the test can verify the cap
    // allowance = buffer + 3, balance = buffer + 2 → expenses_amount is capped at allowance min = buffer
    let (approved_account, approved_account_identifier) = ht_fund_deployer_account(
        deployer,
        buffer_amount + 3,
        buffer_amount + 2,
        deployment_cfg.deployment_allowance_expiration_timeout,
    );
    let approved_account_hex = approved_account_identifier.to_hex();
    ht_set_test_time(0);

    ht_set_test_caller(deployer);
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
        deployment_cfg.deployment_cycles_cost
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
    let deployer = ht_get_test_user();

    let contract_template_id =
        ht_add_contract(admin, ht_get_face_contract_def(), TEST_WASM.to_vec());
    assert_eq!(contract_template_id, 0);

    let deployment_cfg = DeploymentConfig {
        deployment_expenses_amount_buffer_permyriad: 3333,
        deployment_expenses_amount_decimal_places: 6,
        ..DeploymentConfig::default()
    };

    // Configure hub without starting a deployment yet (custom funding amounts needed)
    ht_setup_deployment_config(admin, &deployment_cfg);

    let base_expenses = ht_calc_expenses_amount(&deployment_cfg, TEST_CONTRACT_INITIAL_CYCLES);
    let buffer_amount =
        ht_calc_expenses_amount_buffered(&deployment_cfg, TEST_CONTRACT_INITIAL_CYCLES);

    // Sanity-check: base < buffer (otherwise the test doesn't make sense)
    assert!(base_expenses < buffer_amount);

    // Fund with slightly LESS than the buffer — the hub should use allowance/balance as the cap
    // allowance = buffer - 4, balance = buffer - 3 → expenses_amount is capped at allowance min = buffer - 4
    let (approved_account, approved_account_identifier) = ht_fund_deployer_account(
        deployer,
        buffer_amount - 4,
        buffer_amount - 3,
        deployment_cfg.deployment_allowance_expiration_timeout,
    );
    let approved_account_hex = approved_account_identifier.to_hex();
    ht_set_test_time(0);

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
        deployment_cfg.deployment_cycles_cost
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

    let contract_template_id = ht_add_contract(admin, contract_def, TEST_WASM.to_vec());
    assert_eq!(contract_template_id, 0);

    let approved_account = LedgerAccount::Account {
        owner: ht_get_test_user(),
        subaccount: None,
    };

    // Enable deployment
    ht_setup_deployment_config(admin, &DeploymentConfig::default());

    // Grant RetireContractTemplate permission
    ht_set_test_caller(admin);
    let result = set_access_rights_int(vec![AccessRight {
        caller: admin,
        permissions: Some(vec![
            Permission::SetAccessRights,
            Permission::SetConfig,
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
