import {fromNullishNullable, isNullish, nonNullish} from '@dfinity/utils';
import {useICCanisterCallHub} from 'frontend/src/api/hub/useICCallHub';
import {useDeploymentContext} from 'frontend/src/context/deployment/DeploymentProvider';
import {useCancelDeployment} from 'frontend/src/context/deployment/useCancelDeployment';
import {apiLogger, applicationLogger} from 'frontend/src/context/logger/logger';
import {caughtErrorMessage, exhaustiveCheckFailedMessage, notOwnerMessage, skipMessage} from 'frontend/src/context/logger/loggerConstants';
import {toError} from 'frontend/src/utils/core/error/toError';
import {type FeaturePartial, useFeature} from 'frontend/src/utils/core/feature/feature';
import {delayPromise} from 'frontend/src/utils/core/promise/promiseUtils';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {getSafeTimerTimeoutTillUTCMillis} from 'frontend/src/utils/core/timer/timer';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {createContext, memo, type PropsWithChildren, useContext, useEffect, useMemo, useState} from 'react';
import {type DeploymentInformationStateType, isDeploymentFinalizedWithAnyResult} from './deploymentInformationUtils';
import {useDeploymentStateContext} from './DeploymentStateProvider';

type ProcessingStateAutomatic = {
    processing: 'automatic';
    action:
        | {
              type: 'process';
          }
        | {
              type: 'obtainCertificate';
          };
};

type ProcessingStateManual = {
    processing: 'manual';
    action:
        | {
              type: 'process';
          }
        | {
              type: 'retryCreateCertificate';
          };
};

type ProcessingStateNone = {
    processing: 'none';
};

type ProcessingState = ProcessingStateAutomatic | ProcessingStateManual | ProcessingStateNone;

type ActionError = 'process' | 'obtainCertificate' | 'initializeCertificate';

type Context = {
    tryToProcessManually: () => void;
    cancelDeployment: ReturnType<typeof useCancelDeployment>;
    shouldProcessManually: boolean;
    automaticProcessingInProgress: boolean;
    processInProgress: boolean;
    processFeature: FeaturePartial;
};

const Context = createContext<Context | undefined>(undefined);
export const useDeploymentProcessorContext = () => {
    const context = useContext<Context | undefined>(Context);
    if (!context) {
        throw new Error('useDeploymentProcessorContext must be used within a DeploymentProcessor');
    }
    return context;
};

export const DeploymentProcessor = memo((props: PropsWithChildren) => {
    const {deployment, setDeployment, feature, updateDeploymentFeature, setDeploymentResponseError, isOwnedByCurrentUser, lockedTillMillis} = useDeploymentContext();

    const {call: processDeploymentCall} = useICCanisterCallHub('processDeployment');
    const {call: obtainContractCertificateCall} = useICCanisterCallHub('obtainContractCertificate');
    const {call: initializeContractCertificateCall} = useICCanisterCallHub('initializeContractCertificate');
    const {call: retryGenerateContractCertificateCall} = useICCanisterCallHub('retryGenerateContractCertificate');

    const deploymentId = deployment?.deployment_id;

    const {state: deploymentState} = useDeploymentStateContext();
    const deploymentStateType: DeploymentInformationStateType | undefined = deploymentState?.type;

    const cancelDeployment = useCancelDeployment();

    const [processFeature, updateProcessFeature] = useFeature();
    const processInProgress = processFeature.status.inProgress;

    const [actionError, setActionError] = useState<ActionError | undefined>(undefined);

    const processingState: ProcessingState = useMemo(() => {
        /**
        ==========================================
        Deployment Feature
        ==========================================
        */

        if (feature.error.isError) {
            return {
                processing: 'none'
            };
        }

        /**
        ==========================================
        Action Error
        ==========================================
        */

        if (nonNullish(actionError)) {
            switch (actionError) {
                case 'obtainCertificate':
                case 'initializeCertificate': {
                    return {
                        processing: 'manual',
                        action: {type: 'retryCreateCertificate'}
                    };
                }
                case 'process': {
                    return {
                        processing: 'manual',
                        action: {type: 'process'}
                    };
                }
                default: {
                    const exhaustiveCheck: never = actionError;
                    applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
                }
            }
        }

        /**
        ==========================================
        Process Feature
        ==========================================
        */

        if (processFeature.error.isError) {
            return {
                processing: 'manual',
                action: {type: 'process'}
            };
        }

        /**
        ==========================================
        Processing Error
        ==========================================
        */

        const processingError = fromNullishNullable(deployment?.processing_error);
        if (nonNullish(processingError)) {
            return {
                processing: 'manual',
                action: {type: 'process'}
            };
        }

        /**
        ==========================================
        Need Processing
        ==========================================
        */

        const needProcessing: boolean = deployment?.need_processing === true;
        if (needProcessing) {
            /**
             * "manual" can be returned for testing purposes
             */
            return {
                processing: 'automatic',
                action: {type: 'process'}
            };
        }

        /**
        ==========================================
        Should Obtain Certificate?
        ==========================================
        */

        const shouldObtainCertificate = deploymentStateType == 'WaitingReceiveContractCertificate';
        if (shouldObtainCertificate) {
            return {
                processing: 'automatic',
                action: {type: 'obtainCertificate'}
            };
        }

        return {
            processing: 'none'
        };
    }, [deployment?.need_processing, deployment?.processing_error, deploymentStateType, processFeature.error, feature.error, actionError]);

    const shouldProcessManually = processingState.processing == 'manual';
    const deploymentFinalizedWithAnyResult = useMemo(() => isDeploymentFinalizedWithAnyResult(deployment?.state), [deployment?.state]);
    const automaticProcessingInProgress = processingState.processing == 'automatic' && isOwnedByCurrentUser == true && !deploymentFinalizedWithAnyResult;

    const tryToProcessDeployment = useMemo(
        () =>
            reusePromiseWrapper(async (deployment_id: bigint, delayMillis: number) => {
                const logMessagePrefix = `DeploymentProcessor.tryToProcessDeployment[${deployment_id.toString()}]:`;
                try {
                    if (!isOwnedByCurrentUser) {
                        apiLogger.debug(notOwnerMessage(logMessagePrefix));
                        return;
                    }
                    updateProcessFeature({status: {inProgress: true}});

                    apiLogger.debug(`${logMessagePrefix} pause`, {delayMillis, lockedTillMillis});
                    await delayPromise(delayMillis);

                    const response = await processDeploymentCall([{deployment_id}], {logger: apiLogger, logMessagePrefix});
                    if (hasProperty(response, 'Ok')) {
                        setDeployment(response.Ok.deployment);
                        updateDeploymentFeature({
                            status: {inProgress: false, loaded: true},
                            error: {isError: false, error: undefined}
                        });
                        setDeploymentResponseError(undefined);
                        updateProcessFeature({
                            status: {inProgress: false, loaded: true},
                            error: {isError: false, error: undefined}
                        });
                        setActionError(undefined);
                        return;
                    } else if (hasProperty(response, 'Err')) {
                        const error = toError(getICFirstKey(response.Err));
                        updateProcessFeature({
                            status: {inProgress: false, loaded: true},
                            error: {isError: true, error}
                        });
                        setActionError('process');
                        return;
                    }
                    throw response.Thrown;
                } catch (e) {
                    applicationLogger.error(caughtErrorMessage(logMessagePrefix), e);
                    updateProcessFeature({
                        status: {inProgress: false, loaded: true},
                        error: {isError: true, error: toError(e)}
                    });
                    setActionError('process');
                }
            }),
        [isOwnedByCurrentUser, updateProcessFeature, lockedTillMillis, processDeploymentCall, setDeployment, updateDeploymentFeature, setDeploymentResponseError]
    );

    const tryToObtainCertificate = useMemo(
        () =>
            reusePromiseWrapper(async (deployment_id: bigint) => {
                const logMessagePrefix = `DeploymentProcessor.tryToObtainCertificate[${deployment_id.toString()}]:`;
                try {
                    if (!isOwnedByCurrentUser) {
                        apiLogger.debug(notOwnerMessage(logMessagePrefix));
                        return;
                    }
                    updateProcessFeature({status: {inProgress: true}});

                    /**
                     * Wait 5 seconds before obtaining the certificate to give nodes time to synchronize, as this will be a query call.
                     */
                    await delayPromise(5000);

                    const obtainResponse = await obtainContractCertificateCall([{deployment_id}], {logger: apiLogger, logMessagePrefix});
                    if (hasProperty(obtainResponse, 'Ok')) {
                        const certificate = obtainResponse.Ok.certificate;
                        const logMessagePrefixInner = `${logMessagePrefix} initialize_contract_certificate:`;

                        const initializeResponse = await initializeContractCertificateCall([{deployment_id, certificate}], {
                            logger: apiLogger,
                            logMessagePrefix: logMessagePrefixInner,
                            argsToLog: [{deployment_id}]
                        });
                        if (hasProperty(initializeResponse, 'Ok')) {
                            setDeployment(initializeResponse.Ok.deployment);
                            updateDeploymentFeature({
                                status: {inProgress: false, loaded: true},
                                error: {isError: false, error: undefined}
                            });
                            setDeploymentResponseError(undefined);
                            updateProcessFeature({
                                status: {inProgress: false, loaded: true},
                                error: {isError: false, error: undefined}
                            });
                            setActionError(undefined);
                            return;
                        } else if (hasProperty(initializeResponse, 'Err')) {
                            const error = toError(getICFirstKey(initializeResponse.Err));
                            updateProcessFeature({
                                status: {inProgress: false, loaded: true},
                                error: {isError: true, error}
                            });
                            if (hasProperty(initializeResponse.Err, 'InvalidCertificate')) {
                                setActionError('initializeCertificate');
                            } else {
                                setActionError(undefined);
                            }
                            return;
                        }
                        throw initializeResponse.Thrown;
                    } else if (hasProperty(obtainResponse, 'Err')) {
                        const error = toError(getICFirstKey(obtainResponse.Err));
                        updateProcessFeature({
                            status: {inProgress: false, loaded: true},
                            error: {isError: true, error}
                        });
                        if (hasProperty(obtainResponse.Err, 'CertificateNotFound') || hasProperty(obtainResponse.Err, 'BuildCertificateError')) {
                            setActionError('obtainCertificate');
                        } else {
                            setActionError(undefined);
                        }
                        return;
                    }
                    throw obtainResponse.Thrown;
                } catch (e) {
                    applicationLogger.error(caughtErrorMessage(logMessagePrefix), e);
                    updateProcessFeature({
                        status: {inProgress: false, loaded: true},
                        error: {isError: true, error: toError(e)}
                    });
                    setActionError(undefined);
                }
            }),
        [isOwnedByCurrentUser, updateProcessFeature, obtainContractCertificateCall, initializeContractCertificateCall, setDeployment, updateDeploymentFeature, setDeploymentResponseError]
    );

    const tryToRetryGenerateCertificate = useMemo(
        () =>
            reusePromiseWrapper(async (deployment_id: bigint) => {
                const logMessagePrefix = `DeploymentProcessor.tryToRetryGenerateCertificate[${deployment_id.toString()}]:`;
                try {
                    if (!isOwnedByCurrentUser) {
                        apiLogger.debug(notOwnerMessage(logMessagePrefix));
                        return;
                    }
                    updateProcessFeature({status: {inProgress: true}});

                    const response = await retryGenerateContractCertificateCall([{deployment_id}], {logger: apiLogger, logMessagePrefix});
                    if (hasProperty(response, 'Ok')) {
                        setDeployment(response.Ok.deployment);
                        updateDeploymentFeature({
                            status: {inProgress: false, loaded: true},
                            error: {isError: false, error: undefined}
                        });
                        setDeploymentResponseError(undefined);
                        updateProcessFeature({
                            status: {inProgress: false, loaded: true},
                            error: {isError: false, error: undefined}
                        });
                        setActionError(undefined);
                        return;
                    } else if (hasProperty(response, 'Err')) {
                        const error = toError(getICFirstKey(response.Err));
                        updateProcessFeature({
                            status: {inProgress: false, loaded: true},
                            error: {isError: true, error}
                        });
                        setActionError(undefined);
                        return;
                    }
                    throw response.Thrown;
                } catch (e) {
                    applicationLogger.error(caughtErrorMessage(logMessagePrefix), e);
                    updateProcessFeature({
                        status: {inProgress: false, loaded: true},
                        error: {isError: true, error: toError(e)}
                    });
                    setActionError(undefined);
                }
            }),
        [isOwnedByCurrentUser, updateProcessFeature, retryGenerateContractCertificateCall, setDeployment, updateDeploymentFeature, setDeploymentResponseError]
    );

    const tryToRunAction = useMemo(
        () =>
            reusePromiseWrapper(async (deploymentId: bigint, lockedTillMillis: number | undefined, action: 'process' | 'obtainCertificate' | 'retryCreateCertificate') => {
                try {
                    const lockDelayMillis = getSafeTimerTimeoutTillUTCMillis(lockedTillMillis);
                    switch (action) {
                        case 'process': {
                            await tryToProcessDeployment(deploymentId, lockDelayMillis);
                            break;
                        }
                        case 'obtainCertificate': {
                            await tryToObtainCertificate(deploymentId);
                            break;
                        }
                        case 'retryCreateCertificate': {
                            await tryToRetryGenerateCertificate(deploymentId);
                            break;
                        }
                        default: {
                            const exhaustiveCheck: never = action;
                            applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
                        }
                    }
                } catch (e) {
                    applicationLogger.error(caughtErrorMessage(`DeploymentProcessor.tryToRunAction[${deploymentId}]:`), e);
                }
            }),
        [tryToObtainCertificate, tryToProcessDeployment, tryToRetryGenerateCertificate]
    );

    useEffect(() => {
        if (isNullish(deploymentId)) {
            return;
        }
        if (!isOwnedByCurrentUser) {
            return;
        }
        if (processInProgress) {
            return;
        }

        if (processingState.processing != 'automatic') {
            return;
        }

        const {type} = processingState.action;
        switch (type) {
            case 'process': {
                tryToRunAction(deploymentId, lockedTillMillis, 'process');
                break;
            }
            case 'obtainCertificate': {
                tryToRunAction(deploymentId, lockedTillMillis, 'obtainCertificate');
                break;
            }
            default: {
                const exhaustiveCheck: never = type;
                applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
            }
        }
    }, [deploymentId, isOwnedByCurrentUser, lockedTillMillis, processInProgress, processingState, tryToRunAction]);

    const tryToProcessManually = useMemo(
        () =>
            reusePromiseWrapper(async () => {
                const logMessagePrefix = `DeploymentProcessor.tryToProcessManually[deploymentId=${deploymentId?.toString()}]:`;
                if (isNullish(deploymentId)) {
                    applicationLogger.debug(skipMessage(logMessagePrefix, 'no deploymentId'));
                    return;
                }
                if (!isOwnedByCurrentUser) {
                    applicationLogger.debug(notOwnerMessage(logMessagePrefix));
                    return;
                }
                if (processingState.processing != 'manual') {
                    applicationLogger.debug(skipMessage(logMessagePrefix, 'processingState is not manual'), {processingState});
                    return;
                }
                const {type} = processingState.action;
                switch (type) {
                    case 'process': {
                        tryToRunAction(deploymentId, lockedTillMillis, 'process');
                        break;
                    }
                    case 'retryCreateCertificate': {
                        tryToRunAction(deploymentId, lockedTillMillis, 'retryCreateCertificate');
                        break;
                    }
                    default: {
                        const exhaustiveCheck: never = type;
                        applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
                    }
                }
            }),
        [deploymentId, isOwnedByCurrentUser, lockedTillMillis, processingState, tryToRunAction]
    );

    const value: Context = useMemo(
        () => ({
            tryToProcessManually,
            cancelDeployment,
            shouldProcessManually,
            automaticProcessingInProgress,
            processInProgress,
            processFeature
        }),
        [tryToProcessManually, cancelDeployment, shouldProcessManually, automaticProcessingInProgress, processInProgress, processFeature]
    );

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
});
