import {toNullable} from '@dfinity/utils';
import type {GetDeploymentsParams} from 'frontend/src/api/hub/HubCanister';
import {useICCanisterCallHubAnonymous} from 'frontend/src/api/hub/useICCallHub';
import {toError} from 'frontend/src/utils/core/error/toError';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {type ExtractOptional, getICFirstKey} from 'frontend/src/utils/ic/did';
import {useMemo} from 'react';
import type {ChunkDef, DeploymentsSelector, GetDeploymentsArgs, GetDeploymentsResult} from 'src/declarations/hub/hub.did';
import {apiLogger} from '../logger/logger';

export type FetchChunkParametersSorting = ExtractOptional<GetDeploymentsArgs['sorting']>;

export type FetchChunkParameters = {
    selector: DeploymentsSelector;
    sorting?: FetchChunkParametersSorting;
    count: number;
    start: number;
};
type Context = {
    fetchChunk: (parameters: FetchChunkParameters) => Promise<GetDeploymentsResult>;
};
export const useDeployments = (): Context => {
    const {call} = useICCanisterCallHubAnonymous('getDeployments');

    const fetchChunk = useMemo(
        () =>
            reusePromiseWrapper(async (parameters: FetchChunkParameters) => {
                const logMessagePrefix = `useDeployments:`;

                const chunkDef: ChunkDef = {
                    count: BigInt(parameters.count),
                    start: BigInt(parameters.start)
                };
                const deploymentsArgs: GetDeploymentsParams = {
                    sorting: toNullable(parameters.sorting),
                    selector: parameters.selector,
                    chunk_def: chunkDef
                };

                const response = await call([deploymentsArgs], {logger: apiLogger, logMessagePrefix});
                if (hasProperty(response, 'Ok')) {
                    return response.Ok;
                } else if (hasProperty(response, 'Err')) {
                    throw toError(getICFirstKey(response.Err));
                }
                throw response.Thrown;
            }),
        [call]
    );

    return useMemo(() => ({fetchChunk}), [fetchChunk]);
};
