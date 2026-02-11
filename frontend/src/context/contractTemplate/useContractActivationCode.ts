import {useICCanisterCallHub} from 'frontend/src/api/hub/useICCallHub';
import {toError} from 'frontend/src/utils/core/error/toError';
import {type Feature} from 'frontend/src/utils/core/feature/feature';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {useMemo} from 'react';
import {apiLogger} from '../logger/logger';

type Context = {
    activationCode: string | undefined;
    feature: Feature;
    fetchActivationCode: () => Promise<void>;
};
export const useContractActivationCode = (deploymentId: bigint) => {
    const {call, data, feature} = useICCanisterCallHub('getContractActivationCode');
    const activationCode = data?.code;

    const fetchActivationCode = useMemo(
        () =>
            reusePromiseWrapper(async () => {
                const logMessagePrefix = `useDeploymentActivationCode[${deploymentId.toString()}]:`;
                await call([deploymentId], {
                    logger: apiLogger,
                    logMessagePrefix,
                    onResponseErrorBeforeExit: async (responseError) => {
                        throw toError(getICFirstKey(responseError));
                    }
                });
            }),
        [call, deploymentId]
    );

    const value: Context = useMemo(
        () => ({
            activationCode,
            feature,
            fetchActivationCode
        }),
        [activationCode, feature, fetchActivationCode]
    );

    return value;
};
