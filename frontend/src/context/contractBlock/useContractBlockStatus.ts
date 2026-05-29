import {fromNullable, nonNullish} from '@dfinity/utils';
import {useICCanisterCallHubAnonymous} from 'frontend/src/api/hub/useICCallHub';
import type {Feature} from 'frontend/src/utils/core/feature/feature';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import type {ExtractResponseError} from 'frontend/src/utils/ic/did';
import {useMemo} from 'react';
import type {GetContractBlockStatusArgs, GetContractBlockStatusResponse} from 'src/declarations/hub/hub.did';
import {apiLogger} from '../logger/logger';

export type ContractBlockState =
    | {
          type: 'active';
      }
    | {
          type: 'blocked';
          reason: string;
          timestamp: bigint;
      };

type Response = GetContractBlockStatusResponse;
export type ResponseError = ExtractResponseError<Response>;
type Parameters = GetContractBlockStatusArgs;

type Context = {
    contractBlockState: ContractBlockState | undefined;
    fetchContractBlockStatus: (parameters: Parameters) => Promise<void>;
    feature: Feature;
    responseError: ResponseError | undefined;
};

export const useContractBlockStatus = () => {
    const {call, data, feature, responseError} = useICCanisterCallHubAnonymous('getContractBlockStatus');

    const fetchContractBlockStatus = useMemo(
        () =>
            reusePromiseWrapper(async (parameters: Parameters) => {
                const logMessagePrefix = `useContractBlockStatus:`;

                await call([parameters], {
                    logger: apiLogger,
                    logMessagePrefix
                });
            }),
        [call]
    );

    const contractBlockState = useMemo<ContractBlockState | undefined>(() => {
        if (nonNullish(data)) {
            const blocked = fromNullable(data.blocked);
            if (nonNullish(blocked)) {
                /**
                 * the contract is blocked, we have the reason and the timestamp of when it was blocked
                 */
                return {
                    type: 'blocked',
                    reason: blocked.value,
                    timestamp: blocked.timestamp
                };
            }
            /**
             * the contract is not blocked (active)
             */
            return {
                type: 'active'
            };
        }
    }, [data]);

    return useMemo<Context>(() => ({contractBlockState, fetchContractBlockStatus, feature, responseError}), [contractBlockState, fetchContractBlockStatus, feature, responseError]);
};
