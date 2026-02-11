import {toNullable} from '@dfinity/utils';
import {useICCanisterCallHubAnonymous} from 'frontend/src/api/hub/useICCallHub';
import {toError} from 'frontend/src/utils/core/error/toError';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {type ExtractOptional, getICFirstKey} from 'frontend/src/utils/ic/did';
import {useMemo} from 'react';
import type {ChunkDef, GetContractTemplatesArgs, GetContractTemplatesResult} from 'src/declarations/hub/hub.did';
import {apiLogger} from '../logger/logger';
import {caughtErrorMessage} from '../logger/loggerConstants';

type FetchChunkParametersFilter = ExtractOptional<GetContractTemplatesArgs['filter']>;
export type FetchChunkParametersSorting = ExtractOptional<GetContractTemplatesArgs['sorting']>;

export type FetchChunkParameters = {
    filter?: FetchChunkParametersFilter;
    sorting?: FetchChunkParametersSorting;
    count: number;
    start: number;
};
type Context = {
    fetchChunk: (parameters: FetchChunkParameters) => Promise<GetContractTemplatesResult>;
};
export const useContractTemplates = (): Context => {
    const {call} = useICCanisterCallHubAnonymous('getContractTemplates');

    const fetchChunk = useMemo(
        () =>
            reusePromiseWrapper(async (parameters: FetchChunkParameters) => {
                const logMessagePrefix = `useContracts:`;
                try {
                    const chunkDef: ChunkDef = {
                        count: BigInt(parameters.count),
                        start: BigInt(parameters.start)
                    };
                    const contractTemplatesArgs: GetContractTemplatesArgs = {
                        sorting: toNullable(parameters.sorting),
                        filter: toNullable(parameters.filter),
                        chunk_def: chunkDef
                    };

                    const response = await call([contractTemplatesArgs], {logger: apiLogger, logMessagePrefix});

                    if (hasProperty(response, 'Ok')) {
                        return response.Ok;
                    } else if (hasProperty(response, 'Err')) {
                        throw toError(getICFirstKey(response.Err));
                    }
                    throw response.Thrown;
                } catch (e) {
                    apiLogger.error(caughtErrorMessage(logMessagePrefix), e);
                    throw e;
                }
            }),
        [call]
    );

    return useMemo(() => ({fetchChunk}), [fetchChunk]);
};
