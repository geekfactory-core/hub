#![allow(dead_code)]

use candid::Principal;
use common_canister_impl::components::ledger::to_account_identifier;
use common_canister_types::{LedgerAccount, TimestampMillis};
use common_contract_api::ContractTemplateId;
use hub_canister_api::types::{
    AccessRight, Config, CreateContractCanisterStrategy, CyclesConvertingStrategy, DeploymentId,
    DeploymentInformation, DeploymentResult, FinalizeDeploymentState, IcpXdrConversionRateStrategy,
    Permission,
};
use ic_ledger_types::{AccountIdentifier, DEFAULT_SUBACCOUNT};

use crate::{
    ht_deployment_state_matches,
    queries::obtain_contract_certificate::obtain_contract_certificate_int,
    read_state,
    test::tests::{
        components::{
            ic::ht_set_test_caller, icrc2_ledger::ht_approve_account, ledger::ht_deposit_account,
            time::ht_set_test_time,
        },
        support::fixtures::{
            TEST_DEPLOYMENT_ALLOWANCE_EXPIRATION_TIMEOUT, TEST_DEPLOYMENT_CYCLES_COST,
            TEST_XDR_PERMYRIAD_PER_ICP,
        },
    },
    updates::{
        deploy_contract::deploy_contract_int,
        initialize_contract_certificate::initialize_contract_certificate_int,
        process_deployment::process_deployment_int, set_access_rights::set_access_rights_int,
        set_config::set_config_int,
    },
};
use hub_canister_api::types::DeploymentState;

// ─── Configuration ──────────────────────────────────────────────────────────

/// Parameters that control how the Hub is configured before a deployment test.
///
/// All fields have sensible defaults that match the most common test scenario
/// (CMC-based canister creation + CMC top-up).  Override individual fields
/// with struct-update syntax where you need a different configuration.
///
/// # Example
/// ```ignore
/// let cfg = DeploymentConfig {
///     cycles_converting_strategy: CyclesConvertingStrategy::Skip,
///     contract_canister_creation_strategy: CreateContractCanisterStrategy::OverManagementCanister,
///     ..DeploymentConfig::default()
/// };
/// ```
pub(crate) struct DeploymentConfig {
    pub xdr_permyriad_per_icp: u64,
    pub deployment_cycles_cost: u128,
    pub deployment_allowance_expiration_timeout: u64,
    pub contract_wasm_upload_chunk_size: usize,
    pub cycles_converting_strategy: CyclesConvertingStrategy,
    pub contract_canister_creation_strategy: CreateContractCanisterStrategy,
    pub deployment_expenses_amount_buffer_permyriad: u64,
    pub deployment_expenses_amount_decimal_places: u8,
}

impl Default for DeploymentConfig {
    fn default() -> Self {
        let cmc_canister = Principal::management_canister();
        Self {
            xdr_permyriad_per_icp: TEST_XDR_PERMYRIAD_PER_ICP,
            deployment_cycles_cost: TEST_DEPLOYMENT_CYCLES_COST,
            deployment_allowance_expiration_timeout: TEST_DEPLOYMENT_ALLOWANCE_EXPIRATION_TIMEOUT,
            contract_wasm_upload_chunk_size: 1000,
            cycles_converting_strategy: CyclesConvertingStrategy::CMCTopUp { cmc_canister },
            contract_canister_creation_strategy: CreateContractCanisterStrategy::OverCMC {
                cmc_canister,
            },
            deployment_expenses_amount_buffer_permyriad: 0,
            deployment_expenses_amount_decimal_places: 0,
        }
    }
}

// ─── Result of drive_to_deploying ───────────────────────────────────────────

/// Everything the caller needs after [`ht_drive_to_deploying`] succeeds.
pub(crate) struct DeployingResult {
    pub deployment_id: DeploymentId,
    pub deployer: Principal,
    pub approved_account: LedgerAccount,
    pub approved_account_identifier: AccountIdentifier,
    pub expenses_amount: u64,
    /// The [`Config`] that was applied to the Hub.
    pub config: Config,
    /// The deployment object returned by `deploy_contract_int`.
    pub deployment: DeploymentInformation,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/// Applies `deployment_cfg` to the Hub config and enables deployments.
///
/// Caller **must** already have `SetConfig` permission; use
/// [`ht_setup_deployment_config_with_access`] if you also need to set it.
pub(crate) fn ht_setup_deployment_config(admin: Principal, deployment_cfg: &DeploymentConfig) {
    ht_set_test_caller(admin);
    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());
    let deployment_fallback_account =
        AccountIdentifier::new(&Principal::management_canister(), &DEFAULT_SUBACCOUNT);
    let config = Config {
        deployment_fallback_account_hex: deployment_fallback_account.to_hex(),
        icp_xdr_conversion_rate_strategy: IcpXdrConversionRateStrategy::Fixed {
            xdr_permyriad_per_icp: deployment_cfg.xdr_permyriad_per_icp,
        },
        is_deployment_available: true,
        deployment_cycles_cost: deployment_cfg.deployment_cycles_cost,
        deployment_allowance_expiration_timeout: deployment_cfg
            .deployment_allowance_expiration_timeout,
        contract_wasm_upload_chunk_size: deployment_cfg.contract_wasm_upload_chunk_size,
        cycles_converting_strategy: deployment_cfg.cycles_converting_strategy.clone(),
        contract_canister_creation_strategy: deployment_cfg
            .contract_canister_creation_strategy
            .clone(),
        deployment_expenses_amount_buffer_permyriad: deployment_cfg
            .deployment_expenses_amount_buffer_permyriad,
        deployment_expenses_amount_decimal_places: deployment_cfg
            .deployment_expenses_amount_decimal_places,
        ..config
    };
    assert!(
        set_config_int(config).is_ok(),
        "ht_setup_deployment_config: set_config_int failed"
    );
}

/// Like [`ht_setup_deployment_config`], but also grants the admin
/// `SetConfig` permission first (in addition to any permissions already set).
pub(crate) fn ht_setup_deployment_config_with_access(
    admin: Principal,
    deployment_cfg: &DeploymentConfig,
) {
    ht_set_test_caller(admin);
    let result = set_access_rights_int(vec![AccessRight {
        caller: admin,
        permissions: Some(vec![
            Permission::SetAccessRights,
            Permission::SetConfig,
            Permission::AddContractTemplate,
        ]),
        description: None,
    }]);
    assert!(
        result.is_ok(),
        "ht_setup_deployment_config_with_access: set_access_rights failed: {:?}",
        result
    );
    ht_setup_deployment_config(admin, deployment_cfg);
}

/// Calculates the minimum ICP e8s required for a deployment given the
/// parameters in `deployment_cfg` and `contract_initial_cycles`.
pub(crate) fn ht_calc_expenses_amount(
    deployment_cfg: &DeploymentConfig,
    contract_initial_cycles: u128,
) -> u64 {
    ((contract_initial_cycles + deployment_cfg.deployment_cycles_cost)
        / deployment_cfg.xdr_permyriad_per_icp as u128) as u64
}

/// Deposits `amount` ICP e8s into the test-user's account and registers an
/// ICRC-2 allowance of the same amount expiring after
/// `deployment_allowance_expiration_timeout` milliseconds.
///
/// Returns the funded [`AccountIdentifier`].
pub(crate) fn ht_fund_deployer_account(
    deployer: Principal,
    amount: u64,
    expiration_timeout_ms: u64,
) -> (LedgerAccount, AccountIdentifier) {
    let approved_account = LedgerAccount::Account {
        owner: deployer,
        subaccount: None,
    };
    let approved_account_identifier = to_account_identifier(&approved_account).unwrap();
    let approved_account_hex = approved_account_identifier.to_hex();

    ht_approve_account(approved_account_hex.clone(), expiration_timeout_ms, amount);
    ht_deposit_account(&approved_account_identifier, amount);

    (approved_account, approved_account_identifier)
}

// ─── High-level drivers ───────────────────────────────────────────────────────

/// Drives the hub to the **"deployment created"** state.
///
/// Steps performed:
/// 1. Applies `deployment_cfg` to the Hub (calls `set_config`).
/// 2. Funds the deployer account with exactly the minimum expenses amount.
/// 3. Sets test time to `0`.
/// 4. Calls `deploy_contract_int` as `deployer` and asserts it succeeds.
///
/// Returns a [`DeployingResult`] with everything needed to continue the test.
pub(crate) async fn ht_drive_to_deploying(
    admin: Principal,
    deployer: Principal,
    contract_template_id: ContractTemplateId,
    deployment_cfg: &DeploymentConfig,
    contract_initial_cycles: u128,
    subnet_type: Option<String>,
) -> DeployingResult {
    // 1. Configure hub
    ht_setup_deployment_config(admin, deployment_cfg);

    // 2. Calculate and fund
    let expenses_amount = ht_calc_expenses_amount(deployment_cfg, contract_initial_cycles);
    let (approved_account, approved_account_identifier) = ht_fund_deployer_account(
        deployer,
        expenses_amount,
        deployment_cfg.deployment_allowance_expiration_timeout,
    );

    // 3. Time = 0 (allowance has not expired yet)
    ht_set_test_time(0);

    // 4. Start deployment
    ht_set_test_caller(deployer);
    let result =
        deploy_contract_int(approved_account.clone(), contract_template_id, subnet_type).await;
    assert!(
        result.is_ok(),
        "ht_drive_to_deploying: deploy_contract_int failed: {:?}",
        result
    );

    let deployment = result.unwrap().deployment;

    let config = read_state(|state| state.get_model().get_config_storage().get_config().clone());

    DeployingResult {
        deployment_id: deployment.deployment_id,
        deployer,
        approved_account,
        approved_account_identifier,
        expenses_amount,
        config,
        deployment,
    }
}

/// Drives an existing deployment all the way to the **Finalized** state.
///
/// The function processes every deployment step by:
/// 1. Advancing the test time to just past the lock expiration.
/// 2. Calling `process_deployment_int` and asserting it succeeds.
///
/// After this call the deployment is in
/// `DeploymentState::FinalizeDeployment { result: DeploymentResult::Success, sub_state: FinalizeDeploymentState::Finalized }`.
pub(crate) async fn ht_drive_to_finalized(deployer: Principal, deployment_id: &DeploymentId) {
    // TransferDeployerFundsToTransitAccount → TransferTopUpFundsToCMC
    ht_set_test_caller(deployer);
    assert!(
        process_deployment_int(*deployment_id).await.is_ok(),
        "drive_to_finalized: step TransferDeployerFundsToTransitAccount failed"
    );
    ht_deployment_state_matches!(&deployment_id, DeploymentState::TransferTopUpFundsToCMC);

    // TransferTopUpFundsToCMC → next state (NotifyCMCTopUp or GenerateContractCertificate)
    advance_and_process(deployer, deployment_id).await;

    // Determine which branch we're on based on current state
    let is_cmc = read_state(|state| {
        matches!(
            &state
                .get_model()
                .get_deployments_storage()
                .get_deployment(deployment_id)
                .unwrap()
                .state
                .value,
            DeploymentState::NotifyCMCTopUp { .. }
        )
    });

    if is_cmc {
        // NotifyCMCTopUp → CreateContractCanisterOverCMC
        advance_and_process(deployer, deployment_id).await;
        // CreateContractCanisterOverCMC → GenerateContractCertificate
        advance_and_process(deployer, deployment_id).await;
    }
    // else: already at GenerateContractCertificate (Skip/OverManagementCanister path)

    ht_deployment_state_matches!(&deployment_id, DeploymentState::GenerateContractCertificate);

    // GenerateContractCertificate → WaitingReceiveContractCertificate
    advance_and_process(deployer, deployment_id).await;
    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::WaitingReceiveContractCertificate
    );

    // Obtain and initialize certificate
    ht_set_test_caller(deployer);
    let certificate = obtain_contract_certificate_int(*deployment_id)
        .expect("drive_to_finalized: obtain_contract_certificate_int failed")
        .certificate;

    ht_set_test_caller(deployer);
    let result = initialize_contract_certificate_int(*deployment_id, certificate).await;
    assert!(
        result.is_ok(),
        "drive_to_finalized: initialize_contract_certificate_int failed: {:?}",
        result
    );
    ht_deployment_state_matches!(&deployment_id, DeploymentState::UploadContractWasm { .. });

    // Process all UploadContractWasm chunks
    loop {
        let still_uploading = read_state(|state| {
            matches!(
                &state
                    .get_model()
                    .get_deployments_storage()
                    .get_deployment(deployment_id)
                    .unwrap()
                    .state
                    .value,
                DeploymentState::UploadContractWasm { .. }
            )
        });
        if !still_uploading {
            break;
        }
        advance_and_process(deployer, deployment_id).await;
    }

    // InstallContractWasm → MakeContractSelfControlled
    ht_deployment_state_matches!(&deployment_id, DeploymentState::InstallContractWasm { .. });
    advance_and_process(deployer, deployment_id).await;

    // MakeContractSelfControlled → FinalizeDeployment { StartDeploymentFinalization }
    ht_deployment_state_matches!(&deployment_id, DeploymentState::MakeContractSelfControlled);
    advance_and_process(deployer, deployment_id).await;

    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::FinalizeDeployment {
            result: DeploymentResult::Success,
            sub_state: FinalizeDeploymentState::StartDeploymentFinalization
        }
    );

    // FinalizeDeployment StartDeploymentFinalization → Finalized
    ht_set_test_caller(deployer);
    assert!(
        process_deployment_int(*deployment_id).await.is_ok(),
        "drive_to_finalized: final process step failed"
    );

    ht_deployment_state_matches!(
        &deployment_id,
        DeploymentState::FinalizeDeployment {
            result: DeploymentResult::Success,
            sub_state: FinalizeDeploymentState::Finalized
        }
    );
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async fn advance_and_process(deployer: Principal, deployment_id: &DeploymentId) {
    let expiration = get_deployment_lock_expiration(deployment_id);
    ht_set_test_time(expiration);
    ht_set_test_caller(deployer);
    assert!(
        process_deployment_int(*deployment_id).await.is_ok(),
        "advance_and_process: process_deployment_int failed for deployment {}",
        deployment_id
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
