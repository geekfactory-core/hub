use std::cmp::min;

use candid::Principal;
use common_canister_impl::{components::time::Time, stable_structures::CBor};
use common_canister_types::{LedgerAccount, TimestampMillis, Timestamped, TokenE8s};
use common_contract_api::{ContractActivationCode, ContractTemplateId};
use hub_canister_api::types::{
    DeploymentEventId, DeploymentExpenses, DeploymentId,
    DeploymentProcessingEvent::{self, *},
    DeploymentResult,
    DeploymentState::{self, *},
    FinalizeDeploymentState,
};
use ic_stable_structures::{
    memory_manager::VirtualMemory, DefaultMemoryImpl, RestrictedMemory, StableBTreeMap, StableLog,
};
use serde::{Deserialize, Serialize};

type VM = VirtualMemory<RestrictedMemory<DefaultMemoryImpl>>;
type DeploymentsTable = StableBTreeMap<DeploymentId, CBor<Deployment>, VM>;
type CanisterIndex = StableBTreeMap<Principal, DeploymentId, VM>;
type ContractTemplateIndex = StableBTreeMap<(ContractTemplateId, DeploymentId), (), VM>;
type DeployerIndex = StableBTreeMap<(Principal, DeploymentId), (), VM>;
type DeployerContractTemplateIndex =
    StableBTreeMap<(Principal, ContractTemplateId, DeploymentId), (), VM>;
type EventsLog = StableLog<CBor<Timestamped<DeploymentProcessingEvent>>, VM, VM>;
type EventIndex = StableBTreeMap<(DeploymentId, DeploymentEventId), (), VM>;

pub struct DeploymentsStorage {
    deployments_table: DeploymentsTable,
    canister_index: CanisterIndex,
    contract_template_index: ContractTemplateIndex,
    deployer_index: DeployerIndex,
    deployer_contract_template_index: DeployerContractTemplateIndex,
    events_log: EventsLog,
    events_index: EventIndex,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct Deployment {
    pub created: TimestampMillis,
    pub deployer: Principal,
    pub contract_template_id: ContractTemplateId,
    pub deployment_expenses: DeploymentExpenses,
    pub expenses_amount: TokenE8s,
    pub approved_account: LedgerAccount,
    pub subnet_type: Option<String>,
    pub activation_code: Option<ContractActivationCode>,
    pub state: Timestamped<DeploymentState>,
    pub processing_error: Option<Timestamped<String>>,
    pub contract_canister: Option<Principal>,
    pub lock: Option<DeploymentLock>,
    lock_id_sequence: u64,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Eq, Debug)]
pub struct DeploymentLock {
    pub lock_id: u64,
    pub expiration: TimestampMillis,
}

#[derive(Debug)]
pub enum UpdateDeploymentError {
    WrongState,
    StorageIsLocked { expiration: TimestampMillis },
}

#[macro_export]
macro_rules! state_matches {
    ($expression:expr, $pattern:pat $(if $guard:expr)? $(,)?) => {
        match $expression.state.value {
            $pattern $(if $guard)? => {},
            _ => { return Err(UpdateDeploymentError::WrongState); }
        }
    };
}

#[macro_export]
macro_rules! complete_state_matches {
    ($expression:expr, $pattern:pat $(if $guard:expr)? $(,)?) => {
        match $expression.state.value {
            FinalizeDeployment { sub_state: $pattern $(if $guard)?, ..} => {}
            _ => { return Err(UpdateDeploymentError::WrongState); }
        }
    };
}

impl DeploymentsStorage {
    #[allow(clippy::too_many_arguments)]
    pub(crate) fn init(
        deployments_memory: VM,
        canister_index_memory: VM,
        contract_template_index_memory: VM,
        deployer_index_memory: VM,
        deployer_contract_template_index_memory: VM,
        events_log_index_memory: VM,
        events_log_data_memory: VM,
        event_index_memory: VM,
    ) -> Self {
        Self {
            deployments_table: StableBTreeMap::init(deployments_memory),
            canister_index: StableBTreeMap::init(canister_index_memory),
            contract_template_index: StableBTreeMap::init(contract_template_index_memory),
            deployer_index: StableBTreeMap::init(deployer_index_memory),
            deployer_contract_template_index: StableBTreeMap::init(
                deployer_contract_template_index_memory,
            ),
            events_log: StableLog::init(events_log_index_memory, events_log_data_memory),
            events_index: StableBTreeMap::init(event_index_memory),
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub(crate) fn create_new_deployment(
        &mut self,
        deployer: Principal,
        created: TimestampMillis,
        contract_template_id: ContractTemplateId,
        deployment_expenses: DeploymentExpenses,
        expenses_amount: TokenE8s,
        approved_account: LedgerAccount,
        subnet_type: Option<String>,
        activation_code: Option<ContractActivationCode>,
    ) -> DeploymentId {
        let deployment_id = self.deployments_table.len();

        let deployment = Deployment {
            created,
            deployer,
            contract_template_id,
            deployment_expenses,
            expenses_amount,
            approved_account,
            subnet_type,
            activation_code,
            state: Timestamped::new(created, DeploymentState::StartDeployment),
            processing_error: None,
            contract_canister: None,
            lock_id_sequence: 0,
            lock: None,
        };

        self.deployments_table
            .insert(deployment_id, CBor(deployment));

        self.contract_template_index
            .insert((contract_template_id, deployment_id), ());

        self.deployer_index.insert((deployer, deployment_id), ());

        self.deployer_contract_template_index
            .insert((deployer, contract_template_id, deployment_id), ());

        deployment_id
    }

    pub(crate) fn update_deployment(
        &mut self,
        time: TimestampMillis,
        deployment_id: &DeploymentId,
        lock: &DeploymentLock,
        event: DeploymentProcessingEvent,
    ) -> Result<(), UpdateDeploymentError> {
        self.update_deployment_in_table(
            deployment_id,
            |storage, deployment| -> Result<(), UpdateDeploymentError> {
                let current_lock = deployment.lock.as_ref().unwrap();
                if lock != current_lock {
                    return Err(UpdateDeploymentError::StorageIsLocked {
                        expiration: current_lock.expiration,
                    });
                }

                deployment.processing_error = None;

                match &event {
                    DeploymentCanceled { reason } => match &deployment.state.value {
                        FinalizeDeployment { .. } => {
                            return Err(UpdateDeploymentError::WrongState);
                        }
                        _ => {
                            deployment.state = Timestamped::new(
                                time,
                                FinalizeDeployment {
                                    result: DeploymentResult::Cancelled {
                                        reason: reason.clone(),
                                    },
                                    sub_state: FinalizeDeploymentState::StartDeploymentFinalization,
                                },
                            );
                        }
                    },
                    DeploymentStarted => {
                        state_matches!(deployment, StartDeployment);
                        deployment.state =
                            Timestamped::new(time, TransferDeployerFundsToTransitAccount);
                    }
                    DeployerFundsOnTransitAccountTransferred { .. } => {
                        state_matches!(deployment, TransferDeployerFundsToTransitAccount);
                        deployment.state = Timestamped::new(time, TransferTopUpFundsToCMC);
                    }
                    TopUpFundsToCMCTransferred {
                        cmc_canister,
                        block_index,
                        ..
                    } => {
                        state_matches!(deployment, TransferTopUpFundsToCMC);
                        deployment.state = Timestamped::new(
                            time,
                            NotifyCMCTopUp {
                                cmc_canister: *cmc_canister,
                                block_index: *block_index,
                            },
                        );
                    }
                    TopUpCMCNotified { .. } => {
                        state_matches!(deployment, NotifyCMCTopUp { .. });
                        deployment.state = Timestamped::new(time, CreateContractCanisterOverCMC);
                    }
                    UseExternalServiceConverting { .. } => {
                        state_matches!(deployment, TransferTopUpFundsToCMC | NotifyCMCTopUp { .. });
                        deployment.state = Timestamped::new(time, CreateContractCanisterOverCMC);
                    }
                    ContractCanisterOverCMCCreated { canister, .. } => {
                        state_matches!(deployment, CreateContractCanisterOverCMC);
                        storage.set_contract_canister(time, deployment_id, deployment, canister);
                    }
                    UseManagementCanisterCreation { .. } => {
                        state_matches!(deployment, CreateContractCanisterOverCMC);
                        deployment.state =
                            Timestamped::new(time, CreateContractCanisterOverManagement);
                    }
                    ContractCanisterOverManagementCreated { canister, .. } => {
                        state_matches!(deployment, CreateContractCanisterOverManagement);
                        storage.set_contract_canister(time, deployment_id, deployment, canister);
                    }
                    ContractCertificateGenerated => {
                        state_matches!(deployment, GenerateContractCertificate);
                        deployment.state =
                            Timestamped::new(time, WaitingReceiveContractCertificate);
                    }
                    RetryGenerateContractCertificate => {
                        state_matches!(deployment, WaitingReceiveContractCertificate);
                        deployment.state = Timestamped::new(time, GenerateContractCertificate);
                    }
                    ContractCertificateReceived { certificate } => {
                        state_matches!(deployment, WaitingReceiveContractCertificate);
                        deployment.state = Timestamped::new(
                            time,
                            StartInstallContractWasm {
                                certificate: certificate.clone(),
                            },
                        );
                    }
                    InstallContractWasmStarted {
                        upload_chunk_size,
                        upload_chunk_count,
                    } => {
                        let certificate = match &deployment.state.value {
                            DeploymentState::StartInstallContractWasm { certificate } => {
                                certificate.clone()
                            }
                            _ => {
                                return Err(UpdateDeploymentError::WrongState);
                            }
                        };

                        deployment.state = Timestamped::new(
                            time,
                            UploadContractWasm {
                                certificate: certificate.clone(),
                                upload_chunk_size: *upload_chunk_size,
                                upload_chunk_count: *upload_chunk_count,
                                uploaded_chunk_hashes: vec![],
                            },
                        );
                    }
                    ReUploadContractWasm { .. } => {
                        let certificate = match &deployment.state.value {
                            DeploymentState::UploadContractWasm { certificate, .. } => {
                                certificate.clone()
                            }
                            _ => {
                                return Err(UpdateDeploymentError::WrongState);
                            }
                        };

                        deployment.state = Timestamped::new(
                            time,
                            StartInstallContractWasm {
                                certificate: certificate.clone(),
                            },
                        );
                    }
                    ContractWasmChunkUploaded {
                        chunk_index,
                        chunk_hash,
                    } => {
                        match &deployment.state.value {
                            DeploymentState::UploadContractWasm {
                                certificate,
                                upload_chunk_size,
                                upload_chunk_count,
                                uploaded_chunk_hashes,
                            } => {
                                if chunk_index != &uploaded_chunk_hashes.len()
                                    || chunk_index >= upload_chunk_count
                                {
                                    deployment.state = Timestamped::new(
                                        time,
                                        StartInstallContractWasm {
                                            certificate: certificate.clone(),
                                        },
                                    );
                                } else {
                                    let mut uploaded_chunk_hashes = uploaded_chunk_hashes.clone();
                                    uploaded_chunk_hashes.push(chunk_hash.clone());

                                    deployment.state = Timestamped::new(
                                        time,
                                        UploadContractWasm {
                                            certificate: certificate.clone(),
                                            upload_chunk_size: *upload_chunk_size,
                                            upload_chunk_count: *upload_chunk_count,
                                            uploaded_chunk_hashes,
                                        },
                                    );
                                }
                            }
                            _ => {
                                return Err(UpdateDeploymentError::WrongState);
                            }
                        };
                    }
                    ContractWasmUploaded => {
                        let (certificate, uploaded_chunk_hashes) = match &deployment.state.value {
                            DeploymentState::UploadContractWasm {
                                certificate,
                                uploaded_chunk_hashes,
                                ..
                            } => (certificate.clone(), uploaded_chunk_hashes.clone()),
                            _ => {
                                return Err(UpdateDeploymentError::WrongState);
                            }
                        };

                        deployment.state = Timestamped::new(
                            time,
                            InstallContractWasm {
                                certificate,
                                uploaded_chunk_hashes,
                            },
                        );
                    }
                    ContractWasmInstalled => {
                        state_matches!(deployment, InstallContractWasm { .. });
                        deployment.state = Timestamped::new(time, MakeContractSelfControlled);
                    }
                    ContractSelfControlledMade => {
                        state_matches!(deployment, MakeContractSelfControlled);
                        deployment.state = Timestamped::new(
                            time,
                            FinalizeDeployment {
                                result: DeploymentResult::Success,
                                sub_state: FinalizeDeploymentState::StartDeploymentFinalization,
                            },
                        );
                    }
                    StartCompleteDeployment => {
                        complete_state_matches!(
                            deployment,
                            FinalizeDeploymentState::StartDeploymentFinalization
                        );
                        change_complete_deployment_state(
                            deployment,
                            time,
                            FinalizeDeploymentState::TransferTransitFundsToExternalService,
                        );
                    }
                    TransitFundsToExternalServiceTransferred { .. } => {
                        complete_state_matches!(
                            deployment,
                            FinalizeDeploymentState::TransferTransitFundsToExternalService
                        );
                        change_complete_deployment_state(
                            deployment,
                            time,
                            FinalizeDeploymentState::Finalized,
                        );
                    }
                }

                Ok(())
            },
        )?;

        // ADD EVENT

        let event = CBor(Timestamped::new(time, event));
        match self.events_log.append(&event) {
            Ok(event_id) => {
                self.events_index.insert((*deployment_id, event_id), ());
            }
            Err(error) => {
                ic_cdk::println!(
                    "Deployment {deployment_id}: failed to append event {:?}, error: {error:?}",
                    *event
                );
            }
        }

        Ok(())
    }

    pub(crate) fn set_processing_error(
        &mut self,
        time: &dyn Time,
        deployment_id: &DeploymentId,
        lock: &DeploymentLock,
        error: String,
    ) -> Result<(), UpdateDeploymentError> {
        self.update_deployment_in_table(
            deployment_id,
            |_, deployment| -> Result<(), UpdateDeploymentError> {
                let current_lock = deployment.lock.as_ref().unwrap();
                if lock != current_lock {
                    return Err(UpdateDeploymentError::StorageIsLocked {
                        expiration: current_lock.expiration,
                    });
                }

                deployment.processing_error = Some(Timestamped::new(
                    time.get_current_unix_epoch_time_millis(),
                    error[0..min(error.len(), 1024)].into(),
                ));

                Ok(())
            },
        )
    }

    fn set_contract_canister(
        &mut self,
        time: u64,
        deployment_id: &u64,
        deployment: &mut Deployment,
        canister: &Principal,
    ) {
        deployment.contract_canister = Some(*canister);
        deployment.state = Timestamped::new(time, GenerateContractCertificate);
        self.canister_index.insert(*canister, *deployment_id);
    }

    fn update_deployment_in_table<F, V, E>(
        &mut self,
        deployment_id: &DeploymentId,
        updater: F,
    ) -> Result<V, E>
    where
        F: Fn(&mut Self, &mut Deployment) -> Result<V, E>,
    {
        let mut deployment = self
            .deployments_table
            .get(deployment_id)
            .unwrap()
            .to_owned();

        let result = updater(self, &mut deployment);

        if result.is_ok() {
            self.deployments_table
                .insert(*deployment_id, CBor(deployment));
        }

        result
    }
}

fn change_complete_deployment_state(
    deployment: &mut Deployment,
    time: TimestampMillis,
    sub_state: FinalizeDeploymentState,
) {
    let result = match &*deployment.state {
        FinalizeDeployment { result, .. } => result.clone(),
        _ => panic!(),
    };
    deployment.state = Timestamped::new(time, FinalizeDeployment { result, sub_state });
}

/// Lock management
impl DeploymentsStorage {
    /// Locks a deployment. Returns an error with expiration if the deployment
    /// is already locked by another lock.
    pub(crate) fn lock_deployment(
        &mut self,
        time: &dyn Time,
        deployment_id: &DeploymentId,
        delay: TimestampMillis,
    ) -> Result<DeploymentLock, TimestampMillis> {
        assert!(delay < 3_600_000);

        self.update_deployment_in_table(
            deployment_id,
            |_, deployment| -> Result<DeploymentLock, TimestampMillis> {
                let now = time.get_current_unix_epoch_time_millis();

                if let Some(lock) = deployment.lock.as_ref() {
                    if now < lock.expiration {
                        return Err(lock.expiration);
                    }
                }

                let lock = DeploymentLock {
                    lock_id: deployment.lock_id_sequence,
                    expiration: now + delay,
                };
                deployment.lock = Some(lock.clone());
                deployment.lock_id_sequence += 1;
                Ok(lock)
            },
        )
    }

    /// Unlocks a deployment. Returns `false` if the deployment is not locked
    /// or is locked by another lock.
    pub(crate) fn unlock_deployment(
        &mut self,
        deployment_id: &DeploymentId,
        lock: &DeploymentLock,
    ) -> bool {
        self.update_deployment_in_table(deployment_id, |_, deployment| -> Result<(), ()> {
            if deployment.lock.as_ref().unwrap() == lock {
                deployment.lock = None;
                Ok(())
            } else {
                Err(())
            }
        })
        .is_ok()
    }
}

impl DeploymentsStorage {
    pub(crate) fn get_deployment(&self, deployment_id: &DeploymentId) -> Option<CBor<Deployment>> {
        self.deployments_table.get(deployment_id)
    }

    pub(crate) fn get_deployment_id_by_contract_canister(
        &self,
        contract_canister: &Principal,
    ) -> Option<DeploymentId> {
        self.canister_index.get(contract_canister)
    }

    pub(crate) fn get_event(
        &self,
        event_id: DeploymentEventId,
    ) -> Option<CBor<Timestamped<DeploymentProcessingEvent>>> {
        self.events_log.get(event_id)
    }

    pub(crate) fn get_all_deployments_count(&self) -> u64 {
        self.deployments_table.len()
    }

    pub(crate) fn iterate_by_contract_template<F>(
        &self,
        contract_template_id: ContractTemplateId,
        descending: bool,
        mut receiver: F,
    ) where
        F: FnMut(DeploymentId) -> bool,
    {
        let mut iter = self
            .contract_template_index
            .keys_range((contract_template_id, 0)..(contract_template_id, u64::MAX));

        if descending {
            while let Some(key) = iter.next_back() {
                if !receiver(key.1) {
                    break;
                }
            }
        } else {
            for key in iter {
                if !receiver(key.1) {
                    break;
                }
            }
        }
    }

    pub(crate) fn iterate_by_deployer<F>(
        &self,
        deployer: Principal,
        descending: bool,
        mut receiver: F,
    ) where
        F: FnMut(DeploymentId) -> bool,
    {
        let mut iter = self
            .deployer_index
            .keys_range((deployer, 0)..(deployer, u64::MAX));

        if descending {
            while let Some(key) = iter.next_back() {
                if !receiver(key.1) {
                    break;
                }
            }
        } else {
            for key in iter {
                if !receiver(key.1) {
                    break;
                }
            }
        }
    }

    pub(crate) fn iterate_by_deployer_and_contract_template<F>(
        &self,
        deployer: Principal,
        contract_template_id: ContractTemplateId,
        descending: bool,
        mut receiver: F,
    ) where
        F: FnMut(DeploymentId) -> bool,
    {
        let mut iter = self.deployer_contract_template_index.keys_range(
            (deployer, contract_template_id, 0)..(deployer, contract_template_id, u64::MAX),
        );

        if descending {
            while let Some(key) = iter.next_back() {
                if !receiver(key.2) {
                    break;
                }
            }
        } else {
            for key in iter {
                if !receiver(key.2) {
                    break;
                }
            }
        }
    }

    pub(crate) fn iterate_events<F>(
        &self,
        deployment_id: DeploymentId,
        descending: bool,
        mut receiver: F,
    ) where
        F: FnMut(DeploymentEventId) -> bool,
    {
        let mut iter = self
            .events_index
            .keys_range((deployment_id, 0)..(deployment_id, u64::MAX));

        if descending {
            while let Some(key) = iter.next_back() {
                if !receiver(key.1) {
                    break;
                }
            }
        } else {
            for key in iter {
                if !receiver(key.1) {
                    break;
                }
            }
        }
    }
}
