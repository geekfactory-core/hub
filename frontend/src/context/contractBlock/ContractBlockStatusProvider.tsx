import {isNullish} from '@dfinity/utils';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {createContext, useContext, useMemo, type PropsWithChildren} from 'react';
import {useContractBlockStatus, type ContractBlockDataAvailability, type ContractBlockState} from './useContractBlockStatus';

type Context = {
    deploymentId: bigint;
    contractBlockDataAvailability: ContractBlockDataAvailability | undefined;
    contractBlockState: ContractBlockState | undefined;
    feature: ReturnType<typeof useContractBlockStatus>['feature'];
    fetchCurrentContractBlockStatus: () => Promise<void>;
};

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
    return context;
};

type Props = {
    deploymentId: bigint;
};

export const ContractBlockStatusProvider = (props: PropsWithChildren<Props>) => {
    const {deploymentId} = props;
    const {contractBlockDataAvailability, contractBlockState, fetchContractBlockStatus, feature} = useContractBlockStatus();

    const fetchCurrentContractBlockStatus = useMemo(
        () =>
            reusePromiseWrapper(async () => {
                await fetchContractBlockStatus({
                    filter: {
                        ByDeploymentId: {
                            deployment_id: deploymentId
                        }
                    }
                });
            }),
        [deploymentId, fetchContractBlockStatus]
    );

    const value: Context = useMemo(
        () => ({
            deploymentId,
            contractBlockDataAvailability,
            contractBlockState,
            feature,
            fetchCurrentContractBlockStatus
        }),
        [deploymentId, contractBlockDataAvailability, contractBlockState, feature, fetchCurrentContractBlockStatus]
    );

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};
