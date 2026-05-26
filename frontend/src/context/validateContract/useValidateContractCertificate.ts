import {fromNullable, isNullish, nonNullish} from '@dfinity/utils';
import {useICCanisterCallHubAnonymous} from 'frontend/src/api/hub/useICCallHub';
import {toError} from 'frontend/src/utils/core/error/toError';
import {type DataAvailability, type Feature} from 'frontend/src/utils/core/feature/feature';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import type {ExtractResponseError} from 'frontend/src/utils/ic/did';
import {useMemo} from 'react';
import type {SignedContractCertificate, ValidateContractCertificateArgs, ValidateContractCertificateResponse, ValidateContractCertificateResult} from 'src/declarations/hub/hub.did';
import {apiLogger} from '../logger/logger';

type ContractValidationState =
    | {
          type: 'certificateValidAndActive';
          delayToExpirationMillis: bigint;
          certificate: SignedContractCertificate;
      }
    | {
          type: 'certificateValidButExpired';
          certificate: SignedContractCertificate;
      }
    | {
          type: 'backendErrorWithRetry';
          responseError: ResponseError;
      }
    | {
          type: 'contractBlocked';
          reason: string;
      }
    | {
          type: 'validationFatalError';
      };

export type ContractValidationDataAvailability = DataAvailability<{validationState: ContractValidationState}, {error: Error}>;

type Response = ValidateContractCertificateResponse;
type ResponseError = ExtractResponseError<Response>;
type Parameters = ValidateContractCertificateArgs;

type Context = {
    contractValidationDataAvailability: ContractValidationDataAvailability | undefined;
    validate: (parameters: Parameters) => Promise<void>;
    feature: Feature;
    result: ValidateContractCertificateResult | undefined;
    responseError: ResponseError | undefined;
};

export const useValidateContractCertificate = () => {
    const {call, data: result, feature, responseError} = useICCanisterCallHubAnonymous('validateContractCertificate');

    const validate = useMemo(
        () =>
            reusePromiseWrapper(async (parameters: Parameters) => {
                const logMessagePrefix = `useValidateContractCertificate:`;

                await call([parameters], {
                    logger: apiLogger,
                    logMessagePrefix
                });
            }),
        [call]
    );

    const contractValidationDataAvailability = useMemo<ContractValidationDataAvailability | undefined>(() => {
        const {inProgress, loaded} = feature.status;
        if (!inProgress && !loaded) {
            return undefined;
        }
        if (!loaded) {
            return {type: 'loading'};
        }
        const mappedValidationState = mapContractValidationState(responseError, result);
        if (nonNullish(mappedValidationState)) {
            return {
                type: 'available',
                validationState: mappedValidationState
            };
        }
        if (nonNullish(responseError)) {
            return {
                type: 'notAvailable',
                error: toError()
            };
        } else if (feature.error.isError) {
            /**
             * there was a client side error
             */
            return {
                type: 'notAvailable',
                error: toError(feature.error.error)
            };
        }
        // Illegal state - we should never reach here.
        return {
            type: 'notAvailable',
            error: toError()
        };
    }, [feature, result, responseError]);

    return useMemo<Context>(() => ({contractValidationDataAvailability, validate, feature, result, responseError}), [contractValidationDataAvailability, validate, feature, result, responseError]);
};

export const mapContractValidationState = (
    responseError: ResponseError | undefined,
    result: ValidateContractCertificateResult | undefined
): ContractValidationState | undefined => {
    if (nonNullish(responseError)) {
        const shouldRetry =
            hasProperty(responseError, 'CertificateUnavailable') || hasProperty(responseError, 'ContractInfoUnavailable') || hasProperty(responseError, 'ValidateContractUrlUnavailable');
        if (shouldRetry) {
            return {
                type: 'backendErrorWithRetry',
                responseError
            };
        }
        if (hasProperty(responseError, 'ContractBlocked')) {
            return {
                type: 'contractBlocked',
                reason: responseError.ContractBlocked.reason
            };
        }
        return {
            type: 'validationFatalError'
        };
    }

    if (nonNullish(result)) {
        const delayToExpirationMillis = fromNullable(result.delay_to_expiration_millis);
        if (!isNullish(delayToExpirationMillis)) {
            return {
                type: 'certificateValidAndActive',
                delayToExpirationMillis,
                certificate: result.certificate
            };
        }
        return {
            type: 'certificateValidButExpired',
            certificate: result.certificate
        };
    }
};
