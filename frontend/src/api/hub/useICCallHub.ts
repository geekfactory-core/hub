import {useCanisterContext} from 'frontend/src/context/canister/CanisterProvider';
import {useICCallTypedFor, type OnlyAsyncMethodNames} from '../../utils/ic/api/useICCallTypedFor';
import type {HubAnonymousCanister, HubCanister} from './HubCanister';

export const useICCanisterCallHub = <K extends OnlyAsyncMethodNames<HubCanister>>(method: K) => {
    const {getHubCanister} = useCanisterContext();
    return useICCallTypedFor(getHubCanister, method);
};

export const useICCanisterCallHubAnonymous = <K extends OnlyAsyncMethodNames<HubAnonymousCanister>>(method: K) => {
    const {getHubAnonymousCanister} = useCanisterContext();
    return useICCallTypedFor(getHubAnonymousCanister, method);
};
