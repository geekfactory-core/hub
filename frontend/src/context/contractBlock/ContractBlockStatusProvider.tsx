import {isNullish} from '@dfinity/utils';
import type {Feature} from 'frontend/src/utils/core/feature/feature';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import type {WithoutUndefined} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {createContext, useContext, useMemo, type PropsWithChildren} from 'react';
import {useContractBlockStatus, type ContractBlockState, type ResponseError} from './useContractBlockStatus';

type Context = {
    deploymentId: bigint;
    contractTemplateId: bigint;
    contractBlockState: ContractBlockState | undefined;
    feature: Feature;
    responseError: ResponseError | undefined;
    fetchContractBlockStatus: () => Promise<void>;
};
type SafeContext = WithoutUndefined<Context>;

const Context = createContext<Context | undefined>(undefined);

export const useContractBlockStatusContext = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useContractBlockStatusContext must be used within a ContractBlockStatusProvider');
    }
    return context;
};

export const useContractBlockStatusContextSafe = () => {
    const context = useContext(Context);
    if (isNullish(context)) {
        throw new Error('useContractBlockStatusContextSafe must be used within a ContractBlockStatusProvider');
    }
    if (isNullish(context.contractBlockState)) {
        throw new Error('useContractBlockStatusContextSafe: contractBlockState is nullish');
    }
    return context as SafeContext;
};

type Props = {
    deploymentId: bigint;
    contractTemplateId: bigint;
};

export const ContractBlockStatusProvider = (props: PropsWithChildren<Props>) => {
    const {deploymentId, contractTemplateId} = props;
    const {contractBlockState, fetchContractBlockStatus: fetchContractBlockStatusRaw, feature, responseError} = useContractBlockStatus();

    const fetchContractBlockStatus = useMemo(
        () =>
            reusePromiseWrapper(async () => {
                await fetchContractBlockStatusRaw({
                    filter: {
                        ByDeploymentId: {
                            deployment_id: deploymentId
                        }
                    }
                });
            }),
        [deploymentId, fetchContractBlockStatusRaw]
    );

    const value: Context = useMemo(
        () => ({
            deploymentId,
            contractTemplateId,
            contractBlockState,
            feature,
            responseError,
            fetchContractBlockStatus
        }),
        [deploymentId, contractTemplateId, contractBlockState, feature, responseError, fetchContractBlockStatus]
    );

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};
