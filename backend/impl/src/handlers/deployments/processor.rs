use common_canister_types::TimestampMillis;
use hub_canister_api::types::{DeploymentId, DeploymentProcessingEvent};
use std::fmt::Debug;
use std::future::Future;
use std::pin::Pin;

use crate::components::Environment;
use crate::model::deployments::{DeploymentLock, UpdateDeploymentError};
use crate::{log_error, mutate_state};

use super::factory::get_processor;

const PROCESSING_LOCK_DURATION: TimestampMillis = 600_000;
const DELAY_PROCESSING_AFTER_ERROR: TimestampMillis = 15_000;

#[derive(Debug)]
pub enum ProcessingTaskResult {
    Stop,
    Continue,
    DelayTask { delay: TimestampMillis },
}

pub type Processor<'a> = Box<
    dyn Fn(
        &'a Environment,
        &'a DeploymentId,
        &'a DeploymentLock,
    ) -> Pin<Box<dyn Future<Output = Result<ProcessingTaskResult, String>> + 'a>>,
>;

pub type ProcessorToolkit<'a> = Option<Processor<'a>>;

#[macro_export]
macro_rules! processor_toolkit {
    ($m:ident) => {
        Some(Box::new(
            |env: &'a Environment, deployment_id: &'a DeploymentId, lock: &'a DeploymentLock| {
                Box::pin($m::process(env, deployment_id, lock))
            },
        ))
    };
}

pub(crate) fn need_process_deployment(env: &Environment, deployment_id: &DeploymentId) -> bool {
    get_processor(env, deployment_id).is_some()
}

pub(crate) fn update_deployment_with_lock(
    env: &Environment,
    deployment_id: &DeploymentId,
    event: DeploymentProcessingEvent,
) -> Result<(), UpdateDeploymentError> {
    let lock = try_lock_deployment(env, deployment_id, PROCESSING_LOCK_DURATION)
        .map_err(|expiration| UpdateDeploymentError::StorageIsLocked { expiration })?;

    let result = mutate_state(|state| {
        state
            .get_model_mut()
            .get_deployments_storage_mut()
            .update_deployment(
                env.get_time().get_current_unix_epoch_time_millis(),
                deployment_id,
                &lock,
                event,
            )
    });

    unlock_deployment(env, deployment_id, &lock);

    result
}

/// Returns the expiration time after which the deployment will be retried.
pub(crate) async fn process_deployment(
    env: &Environment,
    deployment_id: &DeploymentId,
) -> Option<TimestampMillis> {
    let lock = match try_lock_deployment(env, deployment_id, PROCESSING_LOCK_DURATION) {
        Ok(lock) => lock,
        Err(other_lock) => return Some(other_lock),
    };

    loop {
        match perform_process_deployment(env, deployment_id, &lock).await {
            Ok(ProcessingTaskResult::Continue) => {}
            Ok(ProcessingTaskResult::Stop) => {
                unlock_deployment(env, deployment_id, &lock);

                return None;
            }
            Ok(ProcessingTaskResult::DelayTask { delay }) => {
                unlock_deployment(env, deployment_id, &lock);

                return Some(
                    try_lock_deployment(env, deployment_id, delay)
                        .map_or_else(|time_lock| time_lock, |lock| lock.expiration),
                );
            }
            Err(error) => {
                handle_processing_error(deployment_id, &lock, error);
                unlock_deployment(env, deployment_id, &lock);

                let delay = DELAY_PROCESSING_AFTER_ERROR;
                return Some(
                    try_lock_deployment(env, deployment_id, delay)
                        .map_or_else(|time_lock| time_lock, |lock| lock.expiration),
                );
            }
        }
    }
}

async fn perform_process_deployment(
    env: &Environment,
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
) -> Result<ProcessingTaskResult, String> {
    if let Some(processor) = get_processor(env, deployment_id) {
        processor(env, deployment_id, lock).await
    } else {
        Ok(ProcessingTaskResult::Stop)
    }
}

fn handle_processing_error(
    deployment_id: &DeploymentId,
    lock: &DeploymentLock,
    processing_error: String,
) {
    mutate_state(|state| {
        let env = state.get_env();
        log_error!(
            env,
            "Deployment '{deployment_id}' processing error: {processing_error}"
        );

        if let Err(handle_error) = state
            .get_model_mut()
            .get_deployments_storage_mut()
            .set_processing_error(
                env.get_time().as_ref(),
                deployment_id,
                lock,
                processing_error,
            )
        {
            log_error!(
                env,
                "Deployment '{deployment_id}': failed to update processing error {handle_error:?}"
            );
        }
    })
}

// Deployment Locks

fn try_lock_deployment(
    env: &Environment,
    deployment_id: &DeploymentId,
    delay: TimestampMillis,
) -> Result<DeploymentLock, TimestampMillis> {
    mutate_state(|state| {
        state
            .get_model_mut()
            .get_deployments_storage_mut()
            .lock_deployment(env.get_time().as_ref(), deployment_id, delay)
    })
}

fn unlock_deployment(env: &Environment, deployment_id: &DeploymentId, lock: &DeploymentLock) {
    mutate_state(|state| {
        if !state
            .get_model_mut()
            .get_deployments_storage_mut()
            .unlock_deployment(deployment_id, lock)
        {
            log_error!(
                env,
                "Deployment '{deployment_id}': cannot unlock deployment"
            );
        }
    })
}
