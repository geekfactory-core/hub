import type {ActorMethod, CallConfig} from '@dfinity/agent';
import type {QueryParams} from '@dfinity/utils';
import {nonNullish} from '@dfinity/utils';
import {getCanisterPrincipalIfValid} from '../principal';

export type QueryParamsWithCanisterId = {canisterId?: string} & QueryParams;

export const applyCallConfig = <A extends Array<unknown>, R>(a: ActorMethod<A, R>, callConfig: CallConfig | undefined): ((...args: A) => Promise<R>) => {
    if (nonNullish(callConfig)) {
        return a.withOptions(callConfig);
    }
    return a;
};

export const getCanisterCallConfig = (params: QueryParamsWithCanisterId): CallConfig | undefined => {
    const validPrincipal = getCanisterPrincipalIfValid(params.canisterId);
    if (nonNullish(params.canisterId)) {
        return {
            canisterId: validPrincipal
        };
    }
    return undefined;
};
