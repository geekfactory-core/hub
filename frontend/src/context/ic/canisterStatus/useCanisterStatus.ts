import {isNullish} from '@dfinity/utils';
import type {GetCanisterStatusParams, HubAnonymousCanister} from 'frontend/src/api/hub/HubCanister';
import {useICCanisterCallHubAnonymous} from 'frontend/src/api/hub/useICCallHub';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import type {ICHookReturn} from 'frontend/src/utils/ic/api/useICCallTypedFor';
import {getCanisterPrincipalIfValid} from 'frontend/src/utils/ic/principal';
import {useMemo} from 'react';
import {apiLogger} from '../../logger/logger';
import {skipMessage} from '../../logger/loggerConstants';

type Context = ICHookReturn<HubAnonymousCanister, 'getCanisterStatus'> & {
    fetchCanisterStatus: () => Promise<void>;
};

export const useCanisterStatus = (canisterId: string): Context => {
    const canisterStatus = useICCanisterCallHubAnonymous('getCanisterStatus');
    const {call} = canisterStatus;

    const fetchCanisterStatus = useMemo(
        () =>
            reusePromiseWrapper(async () => {
                const logMessagePrefix = 'useCanisterStatus:';

                const validCanisterId = getCanisterPrincipalIfValid(canisterId);
                if (isNullish(validCanisterId)) {
                    apiLogger.debug(skipMessage(logMessagePrefix, 'no canisterId'));
                    return;
                }

                const parameters: GetCanisterStatusParams = {
                    canisterId: validCanisterId.toText()
                };
                await call([parameters], {
                    logger: apiLogger,
                    logMessagePrefix,
                    argsToLog: [{canisterId}]
                });
            }),
        [call, canisterId]
    );

    return useMemo(
        () => ({
            ...canisterStatus,
            fetchCanisterStatus
        }),
        [canisterStatus, fetchCanisterStatus]
    );
};
