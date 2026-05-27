import {fromNullable, nonNullish} from '@dfinity/utils';
import {useICCanisterCallHubAnonymous} from 'frontend/src/api/hub/useICCallHub';
import {toError} from 'frontend/src/utils/core/error/toError';
import type {DataAvailability, Feature} from 'frontend/src/utils/core/feature/feature';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {useMemo} from 'react';
import type {GetContractBlockStatusArgs, GetContractBlockStatusResult} from 'src/declarations/hub/hub.did';
import {apiLogger} from '../logger/logger';

type ContractBlockState =
    | {
          type: 'active';
      }
    | {
          type: 'blocked';
          reason: string;
          timestamp: bigint;
      };

export type ContractBlockDataAvailability = DataAvailability<{contractBlockState: ContractBlockState}, {error: Error}>;

type Parameters = GetContractBlockStatusArgs;

type Context = {
    contractBlockDataAvailability: ContractBlockDataAvailability | undefined;
    fetchContractBlockStatus: (parameters: Parameters) => Promise<void>;
    feature: Feature;
    result: GetContractBlockStatusResult | undefined;
};

export const useContractBlockStatus = () => {
    const {call, data: result, feature} = useICCanisterCallHubAnonymous('getContractBlockStatus');

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

    const contractBlockDataAvailability = useMemo<ContractBlockDataAvailability | undefined>(() => {
        const {inProgress, loaded} = feature.status;
        if (!inProgress && !loaded) {
            return undefined;
        }
        if (!loaded) {
            return {type: 'loading'};
        }
        if (feature.error.isError) {
            return {
                type: 'notAvailable',
                error: toError(feature.error.error)
            };
        }
        if (nonNullish(result)) {
            const blocked = fromNullable(result.blocked);
            if (nonNullish(blocked)) {
                return {
                    type: 'available',
                    contractBlockState: {
                        type: 'blocked',
                        reason: blocked.value,
                        timestamp: blocked.timestamp
                    }
                };
            }
            return {
                type: 'available',
                contractBlockState: {
                    type: 'active'
                }
            };
        }
        return {
            type: 'notAvailable',
            error: toError()
        };
    }, [feature, result]);

    return useMemo<Context>(() => ({contractBlockDataAvailability, fetchContractBlockStatus, feature, result}), [contractBlockDataAvailability, fetchContractBlockStatus, feature, result]);
};
