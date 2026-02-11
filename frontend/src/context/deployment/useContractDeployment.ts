import type {Principal} from '@dfinity/principal';
import {fromNullable, isNullish} from '@dfinity/utils';
import type {HubAnonymousCanister} from 'frontend/src/api/hub/HubCanister';
import {useICCanisterCallHubAnonymous} from 'frontend/src/api/hub/useICCallHub';
import {type Feature, type FeaturePartial} from 'frontend/src/utils/core/feature/feature';
import type {ICCall, ICErr} from 'frontend/src/utils/ic/api/useICCallTypedFor';
import {useCallback, useMemo, type Dispatch} from 'react';
import type {DeploymentInformation} from 'src/declarations/hub/hub.did';

type ResponseError = ICErr<HubAnonymousCanister, 'getDeployment'>;

type Context = {
    deployment: DeploymentInformation | undefined;
    setDeployment: (deployment: DeploymentInformation | undefined) => void;
    feature: Feature;
    updateDeploymentFeature: Dispatch<FeaturePartial>;
    responseError: ResponseError | undefined;
    setDeploymentResponseError: Dispatch<ResponseError | undefined>;
    fetchDeployment: ICCall<HubAnonymousCanister, 'getDeployment'>;
    contractCanisterId: Principal | undefined;
};

export const useContractDeployment = (): Context => {
    const {call, data, setData, feature, updateFeature, responseError, setResponseError} = useICCanisterCallHubAnonymous('getDeployment');

    const deployment = data?.deployment;

    const setDeployment = useCallback(
        (deployment: DeploymentInformation | undefined) => {
            if (isNullish(deployment)) {
                setData(undefined);
            } else {
                setData({deployment});
            }
        },
        [setData]
    );

    const contractCanisterId = useMemo<Principal | undefined>(() => {
        if (isNullish(deployment)) {
            return undefined;
        }
        return fromNullable(deployment.contract_canister);
    }, [deployment]);

    return useMemo<Context>(
        () => ({
            deployment,
            setDeployment,
            feature,
            updateDeploymentFeature: updateFeature,
            responseError,
            setDeploymentResponseError: setResponseError,
            fetchDeployment: call,
            contractCanisterId
        }),
        [call, deployment, feature, responseError, setDeployment, setResponseError, updateFeature, contractCanisterId]
    );
};
