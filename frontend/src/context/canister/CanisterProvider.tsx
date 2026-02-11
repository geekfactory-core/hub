import type {HttpAgent} from '@dfinity/agent';
import type {Principal} from '@dfinity/principal';
import {assertNonNullish} from '@dfinity/utils';
import {ContractAnonymousCanister} from 'frontend/src/api/contract/ContractCanister';
import {HubAnonymousCanister, HubCanister} from 'frontend/src/api/hub/HubCanister';
import {Canisters} from 'frontend/src/constants';
import {toError} from 'frontend/src/utils/core/error/toError';
import {wrapWithTryCatch} from 'frontend/src/utils/core/object/objectProxyUtils';
import {isDelegationExpired} from 'frontend/src/utils/ic/delegationUtils';
import type {Logger} from 'frontend/src/utils/logger/Logger';
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, type MutableRefObject, type PropsWithChildren} from 'react';
import {getCanisterPrincipalIfValid} from '../../utils/ic/principal';
import {useAgentContext} from '../agent/AgentProvider';
import {useAuthContext} from '../auth/AuthProvider';
import {delegationExpiredWillLogoutMessage} from '../logger/loggerConstants';

type GetHubCanister = () => Promise<HubCanister>;
export type GetHubAnonymousCanister = () => Promise<HubAnonymousCanister>;

type GetContractAnonymousCanister = (canisterId: string | undefined) => Promise<ContractAnonymousCanister>;

type Context = {
    getHubCanister: GetHubCanister;
    getHubAnonymousCanister: GetHubAnonymousCanister;
    getContractAnonymousCanister: GetContractAnonymousCanister;
};

const Context = createContext<Context | undefined>(undefined);
export function useCanisterContext() {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useCanisterContext must be used within CanisterProvider');
    }
    return context;
}

export function CanisterProvider({children, logger}: PropsWithChildren<{logger: Logger}>) {
    const {isReady, isAuthenticated, identity, logout} = useAuthContext();
    const {getAgent, getAnonymousAgent} = useAgentContext();

    /**
    ==========================================
    Cache
    ==========================================
    */

    const hubCanisterPromiseRef = useRef<Promise<HubCanister> | undefined>(undefined);
    const anonymousHubCanisterPromiseRef = useRef<Promise<HubAnonymousCanister> | undefined>(undefined);

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
            hubCanisterPromiseRef.current = undefined;
        }
    }, [isReady, isAuthenticated, identity]);

    /**
    ==========================================
    Canister Services
    ==========================================
    */

    const getHubCanister: GetHubCanister = useCallback(
        async () =>
            getCanisterCommon<HubCanister>(getAgent, hubCanisterPromiseRef, Canisters.hub, (args) => {
                const actor = HubCanister.create(args);
                const proxy = wrapWithTryCatch(actor, async (error) => {
                    if (isDelegationExpired(error)) {
                        logger.log(delegationExpiredWillLogoutMessage, {error});
                        await logout();
                    }
                });
                return proxy;
            }),
        [getAgent, logger, logout]
    );

    const getHubAnonymousCanister: GetHubAnonymousCanister = useCallback(
        async () => getCanisterCommon<HubAnonymousCanister>(getAnonymousAgent, anonymousHubCanisterPromiseRef, Canisters.hub, (args) => HubAnonymousCanister.create(args)),
        [getAnonymousAgent]
    );

    const getContractAnonymousCanister: GetContractAnonymousCanister = useCallback(
        async (canisterId: string | undefined) => {
            const validCanisterPrincipal = getCanisterPrincipalIfValid(canisterId);
            assertNonNullish(validCanisterPrincipal, 'canisterId is invalid');

            const agent = await getAnonymousAgent();

            return ContractAnonymousCanister.create({
                agent,
                canisterId: validCanisterPrincipal
            });
        },
        [getAnonymousAgent]
    );

    const value = useMemo<Context>(
        () => ({
            getHubCanister,
            getHubAnonymousCanister,
            getContractAnonymousCanister
        }),
        [getHubCanister, getHubAnonymousCanister, getContractAnonymousCanister]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
}

type CreateArgs = {agent: HttpAgent; canisterId: Principal};
async function getCanisterCommon<C>(
    getAgentFn: () => Promise<HttpAgent>,
    promiseRef: MutableRefObject<Promise<C> | undefined>,
    canisterId: string | undefined,
    create: (args: CreateArgs) => C
): Promise<C> {
    if (promiseRef.current) {
        return promiseRef.current;
    }

    const validCanisterPrincipal = getCanisterPrincipalIfValid(canisterId);
    assertNonNullish(validCanisterPrincipal, 'canisterId is invalid');

    const promise = (async () => {
        const agent = await getAgentFn();
        return create({agent, canisterId: validCanisterPrincipal});
    })();

    promiseRef.current = promise;

    try {
        return await promise;
    } catch (e) {
        promiseRef.current = undefined;
        throw toError(e);
    }
}
