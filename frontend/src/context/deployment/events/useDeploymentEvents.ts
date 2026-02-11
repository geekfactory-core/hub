import {toNullable} from '@dfinity/utils';
import {useICCanisterCallHubAnonymous} from 'frontend/src/api/hub/useICCallHub';
import {toError} from 'frontend/src/utils/core/error/toError';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {type ExtractOptional, getICFirstKey} from 'frontend/src/utils/ic/did';
import {useMemo} from 'react';
import type {ChunkDef, GetDeploymentEventsArgs, GetDeploymentEventsResult} from 'src/declarations/hub/hub.did';
import {apiLogger} from '../../logger/logger';

export type FetchChunkParametersSorting = ExtractOptional<GetDeploymentEventsArgs['sorting']>;

export type FetchChunkParameters = {
    sorting?: FetchChunkParametersSorting;
    count: number;
    start: number;
};
type Context = {
    fetchChunk: (parameters: FetchChunkParameters) => Promise<GetDeploymentEventsResult>;
};
export const useDeploymentEvents = (deploymentId: bigint): Context => {
    const {call} = useICCanisterCallHubAnonymous('getDeploymentEvents');

    const fetchChunk = useMemo(
        () =>
            reusePromiseWrapper(async (parameters: FetchChunkParameters) => {
                const logMessagePrefix = `useDeploymentsEvents:`;

                const chunkDef: ChunkDef = {
                    count: BigInt(parameters.count),
                    start: BigInt(parameters.start)
                };
                const chunkArgs: GetDeploymentEventsArgs = {
                    sorting: toNullable(parameters.sorting),
                    chunk_def: chunkDef,
                    deployment_id: deploymentId
                };
                const response = await call([chunkArgs], {logger: apiLogger, logMessagePrefix});
                if (hasProperty(response, 'Ok')) {
                    return response.Ok;
                } else if (hasProperty(response, 'Err')) {
                    throw toError(getICFirstKey(response.Err));
                }
                throw response.Thrown;
            }),
        [call, deploymentId]
    );

    return useMemo(() => ({fetchChunk}), [fetchChunk]);
};
