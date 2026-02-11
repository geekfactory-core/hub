import type {Principal} from '@dfinity/principal';
import {nonNullish} from '@dfinity/utils';
import type {ContractAnonymousCanister} from 'frontend/src/api/contract/ContractCanister';
import {useICCanisterCallContractAnonymous} from 'frontend/src/api/contract/useICCallContract';
import {toError} from 'frontend/src/utils/core/error/toError';
import type {DataAvailability, Feature} from 'frontend/src/utils/core/feature/feature';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import type {ICErr} from 'frontend/src/utils/ic/api/useICCallTypedFor';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {isCanisterPrincipalValid} from 'frontend/src/utils/ic/principal';
import {useMemo} from 'react';
import {useAuthContext} from '../auth/AuthProvider';
import {apiLogger} from '../logger/logger';

type ContractActivationState =
    | {
          type: 'activated';
          owner: Principal;
          isOwnedByCurrentUser: boolean;
      }
    | {
          type: 'notActivated';
      }
    | {
          type: 'activationNotRequired';
      };
export type ContractActivationDataAvailability = DataAvailability<{activationState: ContractActivationState}, {error: Error}>;

type ResponseError = ICErr<ContractAnonymousCanister, 'getContractOwner'>;

type Context = {
    contractActivationDataAvailability: ContractActivationDataAvailability | undefined;
    feature: Feature;
    responseError: ResponseError | undefined;
    fetchContractActivationState: () => Promise<void>;
    isActivatedAndOwnedByCurrentUser: boolean;
};

export const useContractActivationState = (contractCanisterId: string | undefined) => {
    const {principal: currentLoggedInPrincipal} = useAuthContext();
    const {data, call, feature, responseError} = useICCanisterCallContractAnonymous(contractCanisterId, 'getContractOwner');

    const fetchContractActivationState = useMemo(
        () =>
            reusePromiseWrapper(async () => {
                const logMessagePrefix = `useContractOwner:`;

                if (!isCanisterPrincipalValid(contractCanisterId)) {
                    return;
                }

                await call([], {
                    logger: apiLogger,
                    logMessagePrefix,
                    resetErrorOnBeforeRequest: false
                });
            }),
        [call, contractCanisterId]
    );

    const contractActivationDataAvailability = useMemo<ContractActivationDataAvailability | undefined>(() => {
        const {inProgress, loaded} = feature.status;
        if (!inProgress && !loaded) {
            return undefined;
        }
        if (!loaded) {
            return {type: 'loading'};
        }
        if (nonNullish(responseError)) {
            if (hasProperty(responseError, 'ContractNotActivated')) {
                return {type: 'available', activationState: {type: 'notActivated'}};
            } else if (hasProperty(responseError, 'ContractActivationNotRequired')) {
                // Illegal state - we should never reach here. ("getContractOwner" request should not be called if "activation_required" is false in contract definition)
                return {type: 'available', activationState: {type: 'activationNotRequired'}};
            }
            return {type: 'notAvailable', error: toError(getICFirstKey(responseError))};
        }
        if (feature.error.isError) {
            return {type: 'notAvailable', error: toError(feature.error.error)};
        }
        if (nonNullish(data)) {
            const contractOwner = data.owner;
            const isOwnedByCurrentUser = nonNullish(currentLoggedInPrincipal) && currentLoggedInPrincipal.compareTo(contractOwner) == 'eq';
            return {type: 'available', activationState: {type: 'activated', owner: data.owner, isOwnedByCurrentUser}};
        }
        // Illegal state - we should never reach here.
        return {type: 'notAvailable', error: toError()};
    }, [data, feature, responseError, currentLoggedInPrincipal]);

    const isActivatedAndOwnedByCurrentUser = useMemo(() => {
        if (contractActivationDataAvailability?.type == 'available') {
            if (contractActivationDataAvailability.activationState.type == 'activated') {
                return contractActivationDataAvailability.activationState.isOwnedByCurrentUser;
            }
        }
        return false;
    }, [contractActivationDataAvailability]);

    return useMemo<Context>(
        () => ({
            contractActivationDataAvailability,
            feature,
            responseError,
            fetchContractActivationState,
            isActivatedAndOwnedByCurrentUser
        }),
        [contractActivationDataAvailability, feature, responseError, fetchContractActivationState, isActivatedAndOwnedByCurrentUser]
    );
};
