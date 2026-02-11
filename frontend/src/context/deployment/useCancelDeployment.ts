import {useICCanisterCallHub} from 'frontend/src/api/hub/useICCallHub';
import {toError} from 'frontend/src/utils/core/error/toError';
import {type Feature} from 'frontend/src/utils/core/feature/feature';
import {delayPromise} from 'frontend/src/utils/core/promise/promiseUtils';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {getSafeTimerTimeoutTillUTCMillis} from 'frontend/src/utils/core/timer/timer';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {useMemo} from 'react';
import type {CancelDeploymentArgs} from 'src/declarations/hub/hub.did';
import {apiLogger} from '../logger/logger';
import {notOwnerMessage} from '../logger/loggerConstants';
import {useDeploymentContext} from './DeploymentProvider';

type Parameters = CancelDeploymentArgs;

type Context = {
    feature: Feature;
    cancelDeployment: (parameters: Parameters) => Promise<void>;
};
export const useCancelDeployment = (): Context => {
    const {setDeployment, updateDeploymentFeature, setDeploymentResponseError, isOwnedByCurrentUser, lockedTillMillis, fetchCurrentDeployment} = useDeploymentContext();

    const {call, feature} = useICCanisterCallHub('cancelDeployment');

    const cancelDeployment = useMemo(
        () =>
            reusePromiseWrapper(async (parameters: Parameters) => {
                const logMessagePrefix = `useCancelDeployment[${parameters.deployment_id.toString()}]:`;

                if (!isOwnedByCurrentUser) {
                    apiLogger.debug(notOwnerMessage(logMessagePrefix));
                    return;
                }

                const lockDelayMillis = getSafeTimerTimeoutTillUTCMillis(lockedTillMillis);
                apiLogger.debug(`${logMessagePrefix} pause`, {lockDelayMillis, lockedTillMillis});
                await delayPromise(lockDelayMillis);

                await call([parameters], {
                    logger: apiLogger,
                    logMessagePrefix,
                    onResponseOkBeforeExit: async (responseOk) => {
                        setDeployment(responseOk.deployment);
                        updateDeploymentFeature({
                            status: {inProgress: false, loaded: true},
                            error: {isError: false, error: undefined}
                        });
                        setDeploymentResponseError(undefined);
                    },
                    onResponseErrorBeforeExit: async (responseError) => {
                        throw toError(getICFirstKey(responseError));
                    },
                    onThrownErrorBeforeExit: async () => {
                        await fetchCurrentDeployment();
                    }
                });
            }),
        [isOwnedByCurrentUser, lockedTillMillis, call, setDeployment, updateDeploymentFeature, setDeploymentResponseError, fetchCurrentDeployment]
    );

    return useMemo(
        () => ({
            feature,
            cancelDeployment
        }),
        [feature, cancelDeployment]
    );
};
