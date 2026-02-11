import {isNullish, nonNullish} from '@dfinity/utils';
import type {GetDeploymentParams} from 'frontend/src/api/hub/HubCanister';
import {useICCanisterCallHubAnonymous} from 'frontend/src/api/hub/useICCallHub';
import {type DataAvailability, type Feature} from 'frontend/src/utils/core/feature/feature';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {useMemo} from 'react';
import type {DeploymentInformation} from 'src/declarations/hub/hub.did';
import {useAuthContext} from '../auth/AuthProvider';
import {apiLogger} from '../logger/logger';
import {skipMessage} from '../logger/loggerConstants';

type DeploymentExistence = {type: 'exists'; activeDeployment: DeploymentInformation} | {type: 'notExists'};
type ActiveDeploymentDataAvailability = DataAvailability<{existence: DeploymentExistence}>;
type Context = {
    feature: Feature;
    fetchActiveDeployment: () => Promise<void>;
    activeDeploymentDataAvailability: ActiveDeploymentDataAvailability;
};

export const useActiveDeployment = (): Context => {
    const {principal: currentLoggedInPrincipal} = useAuthContext();

    const {call, data, feature} = useICCanisterCallHubAnonymous('getDeployment');
    const activeDeployment = data?.deployment;

    const fetchActiveDeployment = useMemo(
        () =>
            reusePromiseWrapper(async () => {
                const logMessagePrefix = `useActiveDeployment:`;

                if (isNullish(currentLoggedInPrincipal)) {
                    apiLogger.debug(skipMessage(logMessagePrefix, 'not logged in'));
                    return;
                }

                const parameters: GetDeploymentParams = {
                    activeByDeployer: currentLoggedInPrincipal
                };
                await call([parameters], {
                    logger: apiLogger,
                    logMessagePrefix,
                    argsToLog: [{deployer: currentLoggedInPrincipal.toText()}]
                });
            }),
        [call, currentLoggedInPrincipal]
    );

    const activeDeploymentDataAvailability = useMemo<ActiveDeploymentDataAvailability>(() => {
        if (feature.status.loaded) {
            if (feature.error.isError) {
                return {type: 'notAvailable'};
            }
            if (nonNullish(activeDeployment)) {
                return {type: 'available', existence: {type: 'exists', activeDeployment}};
            } else {
                return {type: 'available', existence: {type: 'notExists'}};
            }
        }
        return {type: 'loading'};
    }, [feature.status.loaded, feature.error.isError, activeDeployment]);

    return useMemo<Context>(
        () => ({
            feature,
            fetchActiveDeployment,
            activeDeploymentDataAvailability
        }),
        [feature, fetchActiveDeployment, activeDeploymentDataAvailability]
    );
};
