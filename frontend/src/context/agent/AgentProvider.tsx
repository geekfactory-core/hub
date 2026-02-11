import {AnonymousIdentity, HttpAgent} from '@dfinity/agent';
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, type PropsWithChildren} from 'react';
import {useAuthContext} from '../auth/AuthProvider';

type Context = {
    /**
     * non-anonymous only; throws if not logged in
     */
    getAgent: () => Promise<HttpAgent>;
    getAnonymousAgent: () => Promise<HttpAgent>;
};

const Context = createContext<Context | undefined>(undefined);
export function useAgentContext() {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useAgent must be used within AgentProvider');
    }
    return context;
}

export function AgentProvider({children, host, isDevelopment}: PropsWithChildren<{host?: string; isDevelopment?: boolean}>) {
    const {isReady, isAuthenticated, identity} = useAuthContext();

    /**
    ==========================================
    Cache
    ==========================================
    */

    const agentPromiseRef = useRef<Promise<HttpAgent> | undefined>(undefined);
    const anonAgentPromiseRef = useRef<Promise<HttpAgent> | undefined>(undefined);

    /**
    ==========================================
    Reset on identity change
    ==========================================
    */

    const prevPrincipalRef = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (!isReady) {
            return;
        }
        const principal = isAuthenticated && identity != undefined ? identity.getPrincipal().toText() : undefined;
        if (prevPrincipalRef.current != principal) {
            prevPrincipalRef.current = principal;
            agentPromiseRef.current = undefined;
        }
    }, [isReady, isAuthenticated, identity]);

    /**
    ==========================================
    Agents
    ==========================================
    */

    const getAnonymousAgent = useCallback((): Promise<HttpAgent> => {
        if (anonAgentPromiseRef.current) {
            return anonAgentPromiseRef.current;
        }

        anonAgentPromiseRef.current = HttpAgent.create({
            identity: new AnonymousIdentity(),
            host,
            shouldFetchRootKey: isDevelopment
        });
        return anonAgentPromiseRef.current;
    }, [host, isDevelopment]);

    const getAgent = useCallback((): Promise<HttpAgent> => {
        if (!isReady) {
            throw new Error('Auth not initialized yet');
        }
        if (!isAuthenticated || identity == undefined || identity.getPrincipal().isAnonymous()) {
            throw new Error('Not authenticated — cannot create non-anonymous agent');
        }

        if (agentPromiseRef.current) {
            return agentPromiseRef.current;
        }

        agentPromiseRef.current = HttpAgent.create({
            identity,
            host,
            shouldFetchRootKey: isDevelopment
        });

        return agentPromiseRef.current;
    }, [isReady, isAuthenticated, identity, host, isDevelopment]);

    const value = useMemo<Context>(
        () => ({
            getAgent,
            getAnonymousAgent
        }),
        [getAgent, getAnonymousAgent]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
}
