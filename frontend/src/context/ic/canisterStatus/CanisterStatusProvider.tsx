import type {PropsWithChildren} from 'react';
import {createContext, useContext, useMemo} from 'react';
import {useCanisterMetadataStatus} from './useCanisterMetadataStatus';
import {useCanisterStatus} from './useCanisterStatus';

type Context = {
    canisterId: string;
    canisterStatus: ReturnType<typeof useCanisterStatus>;
    canisterMetadataStatus: ReturnType<typeof useCanisterMetadataStatus>;
};
const Context = createContext<Context | undefined>(undefined);

export const useCanisterStatusContext = () => {
    const context = useContext<Context | undefined>(Context);
    if (!context) {
        throw new Error('useCanisterStatusContext must be used within a CanisterStatusProvider');
    }
    return context;
};

type Props = {
    canisterId: string;
};
export const CanisterStatusProvider = (props: PropsWithChildren<Props>) => {
    const {canisterId} = props;

    const canisterStatus = useCanisterStatus(canisterId);
    const canisterMetadataStatus = useCanisterMetadataStatus(canisterId);

    const value = useMemo(() => ({canisterId, canisterStatus, canisterMetadataStatus}), [canisterId, canisterStatus, canisterMetadataStatus]);

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};
