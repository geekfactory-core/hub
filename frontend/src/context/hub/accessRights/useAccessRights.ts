import {useICCanisterCallHubAnonymous} from 'frontend/src/api/hub/useICCallHub';
import {toError} from 'frontend/src/utils/core/error/toError';
import {type Feature} from 'frontend/src/utils/core/feature/feature';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {useMemo} from 'react';
import type {AccessRight} from 'src/declarations/hub/hub.did';
import {apiLogger} from '../../logger/logger';

type Context = {
    accessRights?: Array<AccessRight>;
    feature: Feature;
    fetchAccessRights: () => Promise<void>;
};
export const useAccessRights = (): Context => {
    const {call, data, feature} = useICCanisterCallHubAnonymous('getAccessRights');

    const fetchAccessRights = useMemo(
        () =>
            reusePromiseWrapper(async () => {
                const logMessagePrefix = `useAccessRights:`;

                await call([], {
                    logger: apiLogger,
                    logMessagePrefix,
                    onResponseErrorBeforeExit: async (responseError) => {
                        throw toError(getICFirstKey(responseError));
                    }
                });
            }),
        [call]
    );

    return useMemo(
        () => ({
            accessRights: data?.access_rights,
            feature,
            fetchAccessRights
        }),
        [data, feature, fetchAccessRights]
    );
};
