import type {Principal} from '@dfinity/principal';
import {fromNullable, isNullish, nonNullish, type Nullable} from '@dfinity/utils';
import type {KeysOfUnion} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import type {DeploymentState, FinalizeDeploymentState} from 'src/declarations/hub/hub.did';

export type DeploymentInformationStateType = KeysOfUnion<DeploymentState>;

export const isDeploymentFinalizedWithAnyResult = (deploymentState: DeploymentState | undefined): boolean => {
    if (nonNullish(deploymentState) && hasProperty(deploymentState, 'FinalizeDeployment')) {
        return isFinalizeDeploymentSubStateFinalized(deploymentState.FinalizeDeployment.sub_state);
    }
    return false;
};

export const isFinalizeDeploymentSubStateFinalized = (finalizeDeploymentState: FinalizeDeploymentState | undefined): boolean => {
    if (nonNullish(finalizeDeploymentState) && hasProperty(finalizeDeploymentState, 'Finalized')) {
        return true;
    }
    return false;
};

export const isDeploymentTerminationPossible = (deploymentState: DeploymentState | undefined): boolean => {
    if (isNullish(deploymentState)) {
        return false;
    }
    if (hasProperty(deploymentState, 'FinalizeDeployment')) {
        return false;
    }
    return true;
};

/**
==========================================
Contract Deployment State
==========================================
*/
export type ContractDeploymentState =
    | {
          type: 'deploying';
      }
    | {
          type: 'success';
          contractCanisterId: string;
      }
    | {
          type: 'terminated';
          reason: string;
      };

export const getContractDeploymentState = (deploymentState: DeploymentState, contractCanister: Nullable<Principal>): ContractDeploymentState | undefined => {
    if (!hasProperty(deploymentState, 'FinalizeDeployment')) {
        return {type: 'deploying'};
    }
    if (!hasProperty(deploymentState.FinalizeDeployment.sub_state, 'Finalized')) {
        return {type: 'deploying'};
    }
    const deploymentResult = deploymentState.FinalizeDeployment.result;
    if (hasProperty(deploymentResult, 'Success')) {
        const canister = fromNullable(contractCanister);
        if (isNullish(canister)) {
            // Illegal state - we should never reach here.
            return undefined;
        }
        return {type: 'success', contractCanisterId: canister.toText()};
    } else if (hasProperty(deploymentResult, 'Cancelled')) {
        return {type: 'terminated', reason: deploymentResult.Cancelled.reason};
    }
    // Illegal state - we should never reach here.
    return undefined;
};
