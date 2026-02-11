import type {Identity} from '@dfinity/agent';
import {principalToAccountIdentifier} from '@dfinity/nns';
import type {Principal} from '@dfinity/principal';
import {toError} from 'frontend/src/utils/core/error/toError';
import type {Logger} from 'frontend/src/utils/logger/Logger';
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren} from 'react';
import {AuthService} from './AuthService';

type LoginOptions = Parameters<AuthService['login']>[0];

type Context = {
    isReady: boolean;
    isAuthenticating: boolean;
    isAuthenticated: boolean | undefined;
    identity: Identity | undefined;
    principal: Principal | undefined;
    accountIdentifierHex: string | undefined;

    login: (options?: LoginOptions) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;

    isCurrentLoggedInPrincipal: (principal: Principal | undefined) => boolean;
};

const Context = createContext<Context | undefined>(undefined);
export function useAuthContext() {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export function AuthProvider(props: PropsWithChildren<{logger: Logger}>) {
    const {children, logger} = props;
    const [isReady, setIsReady] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);
    const [identity, setIdentity] = useState<Identity | undefined>(undefined);
    const [principal, setPrincipal] = useState<Principal | undefined>(undefined);
    const [accountIdentifierHex, setAccountIdentifierHex] = useState<string | undefined>(undefined);

    const logMessagePrefix = 'AuthProvider:';

    const serviceRef = useRef<AuthService | null>(null);
    if (serviceRef.current == undefined) {
        serviceRef.current = new AuthService();
    }

    const applyIdentity = useCallback(
        (identity: Identity) => {
            const principal = identity.getPrincipal();
            const account = principalToAccountIdentifier(principal);
            setIdentity(identity);
            setPrincipal(principal);
            setAccountIdentifierHex(account);
            setIsAuthenticated(true);
            setIsAuthenticating(false);
            setIsReady(true);
            logger.log(`${logMessagePrefix} authorized`, {principal: principal.toText(), accountIdentifierHex: account});
        },
        [logger]
    );

    const reset = useCallback(() => {
        setIdentity(undefined);
        setPrincipal(undefined);
        setAccountIdentifierHex(undefined);
        setIsAuthenticated(false);
        setIsAuthenticating(false);
        setIsReady(true);
    }, []);

    const initializedRef = useRef(false);
    useEffect(() => {
        if (initializedRef.current) {
            return;
        }
        initializedRef.current = true;

        (async () => {
            try {
                setIsAuthenticating(true);
                const identity = await serviceRef.current!.autologin();
                if (identity != undefined) {
                    applyIdentity(identity);
                    return;
                }
                reset();
            } catch (e) {
                logger.error(`${logMessagePrefix} autologin failed`, toError(e));
                reset();
            }
        })();
    }, [applyIdentity, logger, reset]);

    const login = useCallback(
        async (options?: LoginOptions) => {
            try {
                setIsAuthenticating(true);
                const {identity, authnMethod} = await serviceRef.current!.login(options);
                logger.debug(`${logMessagePrefix} logged with`, {authnMethod});
                applyIdentity(identity);
            } catch (e) {
                logger.error(`${logMessagePrefix} login failed`, toError(e));
                reset();
            }
        },
        [applyIdentity, logger, reset]
    );

    const logout = useCallback(async () => {
        try {
            await serviceRef.current!.logout();
            logger.log(`${logMessagePrefix} logged out`);
        } catch (e) {
            logger.error(`${logMessagePrefix} logout failed`, toError(e));
        } finally {
            reset();
        }
    }, [logger, reset]);

    const refresh = useCallback(async () => {
        try {
            const identity = await serviceRef.current!.autologin();
            if (identity != undefined) {
                applyIdentity(identity);
            } else {
                await logout();
            }
        } catch (e) {
            logger.error(`${logMessagePrefix} refresh failed`, toError(e));
            await logout();
        }
    }, [applyIdentity, logger, logout]);

    const isCurrentLoggedInPrincipal = useCallback(
        (anotherPrincipal: Principal | undefined) => {
            if (principal == undefined || anotherPrincipal == undefined) {
                return false;
            }
            return principal.compareTo(anotherPrincipal) == 'eq';
        },
        [principal]
    );

    const value = useMemo<Context>(
        () => ({
            isReady,
            isAuthenticating,
            isAuthenticated,
            identity,
            principal,
            accountIdentifierHex,
            login,
            logout,
            refresh,
            isCurrentLoggedInPrincipal
        }),
        [isReady, isAuthenticating, isAuthenticated, identity, principal, accountIdentifierHex, login, logout, refresh, isCurrentLoggedInPrincipal]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
}
