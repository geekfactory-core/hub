import type {HubCanister} from 'frontend/src/api/hub/HubCanister';
import {useICCanisterCallHub} from 'frontend/src/api/hub/useICCallHub';
import {sendRefreshCurrentContractTemplateNotification} from 'frontend/src/components/pages/contractTemplate/ContractTemplatePreloader';
import {type Feature} from 'frontend/src/utils/core/feature/feature';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import type {ICResponse} from 'frontend/src/utils/ic/api/useICCallTypedFor';
import type {ExtractResponseError} from 'frontend/src/utils/ic/did';
import {useMemo} from 'react';
import type {DeployContractArgs, DeployContractResponse} from 'src/declarations/hub/hub.did';
import {apiLogger} from '../logger/logger';

type Response = DeployContractResponse;
type ResponseError = ExtractResponseError<Response>;
type Parameters = DeployContractArgs;

type Context = {
    feature: Feature;
    deployContract: (parameters: Parameters) => Promise<ICResponse<HubCanister, 'deployContract'>>;
    responseError: ResponseError | undefined;
};
export const useDeployContract = (): Context => {
    const {call, feature, responseError} = useICCanisterCallHub('deployContract');

    const deployContract = useMemo<Context['deployContract']>(
        () =>
            reusePromiseWrapper(async (parameters: Parameters) => {
                const logMessagePrefix = `useDeployContract:`;

                return await call([parameters], {
                    logger: apiLogger,
                    logMessagePrefix,
                    onResponseOkBeforeExit: async () => {
                        sendRefreshCurrentContractTemplateNotification();
                    }
                });
            }),
        [call]
    );

    return useMemo(
        () => ({
            feature,
            deployContract,
            responseError
        }),
        [feature, deployContract, responseError]
    );
};
