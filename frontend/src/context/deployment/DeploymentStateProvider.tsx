import {type TransformUnion, getSingleEntryUnion} from 'frontend/src/utils/core/typescript/typescriptAddons';
import type {PropsWithChildren} from 'react';
import {createContext, useContext, useMemo} from 'react';
import type {DeploymentState} from 'src/declarations/hub/hub.did';
import {useDeploymentContextSafe} from './DeploymentProvider';

export type DeploymentStateUnion = TransformUnion<DeploymentState>;

type Context = {
    state: DeploymentStateUnion | undefined;
};

const Context = createContext<Context | undefined>(undefined);
export const useDeploymentStateContext = () => {
    const context = useContext<Context | undefined>(Context);
    if (!context) {
        throw new Error('useDeploymentStateContext must be used within a DeploymentStateProvider');
    }
    return context;
};

export const DeploymentStateProvider = (props: PropsWithChildren) => {
    const {deployment} = useDeploymentContextSafe();
    const state: DeploymentStateUnion | undefined = useMemo(() => getSingleEntryUnion(deployment.state), [deployment.state]);
    const value: Context = useMemo(() => ({state}), [state]);
    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};
