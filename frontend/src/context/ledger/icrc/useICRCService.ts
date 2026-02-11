import {IcrcLedgerCanister} from '@dfinity/ledger-icrc';
import type {Principal} from '@dfinity/principal';
import {useCallback, useMemo} from 'react';
import {useAgentContext} from '../../agent/AgentProvider';

type Context = {
    getICRCLedgerServiceAnonymous: (canisterId: Principal) => Promise<IcrcLedgerCanister>;
};

export function useICRCService(): Context {
    const {getAnonymousAgent} = useAgentContext();

    const getICRCLedgerServiceAnonymous = useCallback(
        async (canisterId: Principal) => {
            const anonymousAgent = await getAnonymousAgent();
            return IcrcLedgerCanister.create({agent: anonymousAgent, canisterId});
        },
        [getAnonymousAgent]
    );

    return useMemo<Context>(
        () => ({
            getICRCLedgerServiceAnonymous
        }),
        [getICRCLedgerServiceAnonymous]
    );
}
