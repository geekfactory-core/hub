use crate::{get_env, read_state};
use hub_canister_api::{get_contract_activation_code::*, types::DeploymentId};
use ic_cdk_macros::query;

#[query]
fn get_contract_activation_code(Args { deployment_id }: Args) -> Response {
    get_contract_activation_code_int(deployment_id).into()
}

pub(crate) fn get_contract_activation_code_int(
    deployment_id: DeploymentId,
) -> Result<GetContractActivationCodeResult, GetContractActivationCodeError> {
    read_state(|state| {
        let deployment = state
            .get_model()
            .get_deployments_storage()
            .get_deployment(&deployment_id)
            .ok_or(GetContractActivationCodeError::DeploymentNotFound)?;

        if deployment.deployer != get_env().get_ic().get_caller() {
            return Err(GetContractActivationCodeError::PermissionDenied);
        }

        deployment
            .activation_code
            .as_ref()
            .map(|code| GetContractActivationCodeResult { code: code.clone() })
            .ok_or(GetContractActivationCodeError::ContractActivationNotRequired)
    })
}
