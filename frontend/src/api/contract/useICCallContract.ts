import {useCanisterContext} from 'frontend/src/context/canister/CanisterProvider';
import {useCallback, useMemo} from 'react';
import {useICCallTypedFor, type OnlyAsyncMethodNames} from '../../utils/ic/api/useICCallTypedFor';
import type {ContractAnonymousCanister} from './ContractCanister';

const useContractAnonymousCanisterFactory = (canisterId: string | undefined) => {
    const {getContractAnonymousCanister} = useCanisterContext();

    const getActor = useCallback(() => {
        return getContractAnonymousCanister(canisterId);
    }, [getContractAnonymousCanister, canisterId]);

    return useMemo(() => ({getActor}), [getActor]);
};

export const useICCanisterCallContractAnonymous = <K extends OnlyAsyncMethodNames<ContractAnonymousCanister>>(canisterId: string | undefined, method: K) => {
    const {getActor} = useContractAnonymousCanisterFactory(canisterId);
    return useICCallTypedFor(getActor, method);
};
