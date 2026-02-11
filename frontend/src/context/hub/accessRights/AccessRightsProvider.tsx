import {createContext, type PropsWithChildren, useContext, useEffect} from 'react';
import {useAccessRights} from './useAccessRights';

type Context = ReturnType<typeof useAccessRights>;

const Context = createContext<Context | undefined>(undefined);
export const useAccessRightsContext = () => {
    const context = useContext<Context | undefined>(Context);
    if (!context) {
        throw new Error('useAccessRightsContext must be used within an AccessRightsProvider');
    }
    return context;
};

export const AccessRightsProvider = (props: PropsWithChildren) => {
    const accessRights = useAccessRights();
    const {fetchAccessRights} = accessRights;

    useEffect(() => {
        fetchAccessRights();
    }, [fetchAccessRights]);

    return <Context.Provider value={accessRights}>{props.children}</Context.Provider>;
};
