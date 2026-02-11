import {fromNullishNullable, isNullish} from '@dfinity/utils';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import type {WithoutUndefined} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {createContext, useContext, useMemo, type PropsWithChildren} from 'react';
import {useAuthContext} from '../auth/AuthProvider';
import {apiLogger} from '../logger/logger';
import {useContractDeployment} from './useContractDeployment';

type Context = Omit<ReturnType<typeof useContractDeployment>, 'fetchDeployment'> & {
    fetchCurrentDeployment: () => Promise<void>;
    isOwnedByCurrentUser: boolean | undefined;
    lockedTillMillis: number | undefined;
};
type SafeContext = Omit<WithoutUndefined<Context>, 'setDeployment' | 'updateDeploymentFeature' | 'setDeploymentResponseError'>;

const Context = createContext<Context | undefined>(undefined);
export const useDeploymentContext = () => {
    const context = useContext<Context | undefined>(Context);
    if (!context) {
        throw new Error('useDeploymentContext must be used within a DeploymentProvider');
    }
    return context;
};

export const useDeploymentContextSafe = (): SafeContext => {
    const context = useContext<Context | undefined>(Context);
    if (isNullish(context)) {
        throw new Error('useDeploymentContext must be used within a DeploymentProvider');
    }
    if (isNullish(context.deployment)) {
        throw new Error('useDeploymentContextSafe: deployment is nullish');
    }
    if (isNullish(context.isOwnedByCurrentUser)) {
        throw new Error('useDeploymentContextSafe: isOwnedByCurrentUser is nullish');
    }
    return context as SafeContext;
};

type Props = {
    deploymentId: bigint;
};
export const DeploymentProvider = (props: PropsWithChildren<Props>) => {
    const {deploymentId} = props;
    const {isCurrentLoggedInPrincipal} = useAuthContext();

    const contractDeployment = useContractDeployment();
    const {deployment, fetchDeployment} = contractDeployment;

    const fetchCurrentDeployment = useMemo(
        () =>
            reusePromiseWrapper(async () => {
                await fetchDeployment([{deploymentId, certified: true}], {
                    logger: apiLogger,
                    logMessagePrefix: 'DeploymentProvider.fetchCurrentDeployment:'
                });
            }),
        [deploymentId, fetchDeployment]
    );

    const isOwnedByCurrentUser: boolean | undefined = useMemo(() => isCurrentLoggedInPrincipal(deployment?.deployer), [isCurrentLoggedInPrincipal, deployment?.deployer]);

    const lockedTillMillis: number | undefined = useMemo(() => {
        const lockedTill = fromNullishNullable(deployment?.lock)?.time;
        if (isNullish(lockedTill)) {
            return undefined;
        }
        return Number(lockedTill);
    }, [deployment?.lock]);

    const value: Context = useMemo(
        () => ({
            ...contractDeployment,
            fetchCurrentDeployment,
            isOwnedByCurrentUser,
            lockedTillMillis
        }),
        [contractDeployment, fetchCurrentDeployment, isOwnedByCurrentUser, lockedTillMillis]
    );

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};
