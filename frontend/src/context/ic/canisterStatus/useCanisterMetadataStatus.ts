import {CanisterStatus} from '@dfinity/agent';
import type {StatusMap} from '@dfinity/agent/lib/esm/canisterStatus';
import type {Status, SubnetStatus} from '@dfinity/agent/lib/esm/canisterStatus/index';
import {Principal} from '@dfinity/principal';
import {assertNonNullish, isNullish, nonNullish} from '@dfinity/utils';
import {compactArray} from 'frontend/src/utils/core/array/array';
import {toError} from 'frontend/src/utils/core/error/toError';
import {type Feature, useFeature} from 'frontend/src/utils/core/feature/feature';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {isNonEmptyString} from 'frontend/src/utils/core/string/string';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {safeCall} from 'frontend/src/utils/ic/api/safeCall';
import {useMemo, useState} from 'react';
import {useAgentContext} from '../../agent/AgentProvider';
import {apiLogger} from '../../logger/logger';
import {caughtErrorMessage, skipMessage} from '../../logger/loggerConstants';

type Context = {
    controllers: Array<string> | undefined;
    moduleHash: string | undefined;
    subnetId: string | undefined;

    feature: Feature;
    fetchCanisterMetadataStatus: () => Promise<void>;
};

export const useCanisterMetadataStatus = (canisterId: string | undefined): Context => {
    const {getAnonymousAgent} = useAgentContext();

    const [controllers, setControllers] = useState<Array<string> | undefined>(undefined);
    const [moduleHash, setModuleHash] = useState<string | undefined>(undefined);
    const [subnetId, setSubnetId] = useState<string | undefined>(undefined);
    const [feature, updateFeature] = useFeature();

    const fetchCanisterMetadataStatus = useMemo(
        () =>
            reusePromiseWrapper(async () => {
                const logMessagePrefix = `useCanisterMetadataStatus:`;
                try {
                    if (isNullish(canisterId)) {
                        apiLogger.debug(skipMessage(logMessagePrefix, 'no canisterId'));
                        return;
                    }
                    updateFeature({status: {inProgress: true}});

                    const anonymousAgent = await getAnonymousAgent();
                    assertNonNullish(anonymousAgent, 'noAgent');

                    const call = safeCall(CanisterStatus.request, {logger: apiLogger, logMessagePrefix, argsToLog: [{canisterId}]});
                    const response = await call({
                        agent: anonymousAgent,
                        canisterId: Principal.fromText(canisterId),
                        paths: ['controllers', 'module_hash', 'subnet']
                    });
                    if (hasProperty(response, 'Ok')) {
                        const responseOk: StatusMap = response.Ok;
                        const controllers_ = responseOk.get('controllers');
                        const moduleHash_ = responseOk.get('module_hash');
                        const subnet = responseOk.get('subnet');
                        apiLogger.debug(`${logMessagePrefix} raw values`, {
                            controllers_,
                            moduleHash_,
                            subnet
                        });
                        const controllers = parseControllers(controllers_);
                        const moduleHash = parseModuleHash(moduleHash_);
                        const subnetId = parseSubnetId(subnet);
                        apiLogger.debug(`${logMessagePrefix} parsed values`, {
                            controllers,
                            moduleHash,
                            subnetId
                        });

                        setControllers(controllers);
                        setModuleHash(moduleHash);
                        setSubnetId(subnetId);
                        updateFeature({
                            status: {inProgress: false, loaded: true},
                            error: {isError: false, error: undefined}
                        });
                    } else {
                        throw response.Thrown;
                    }
                } catch (e) {
                    apiLogger.error(caughtErrorMessage(logMessagePrefix), e);
                    updateFeature({
                        status: {inProgress: false, loaded: true},
                        error: {isError: true, error: toError(e)}
                    });
                }
            }),
        [getAnonymousAgent, canisterId, updateFeature]
    );

    return useMemo<Context>(
        () => ({
            controllers,
            moduleHash,
            subnetId,

            feature,
            fetchCanisterMetadataStatus
        }),
        [controllers, moduleHash, subnetId, feature, fetchCanisterMetadataStatus]
    );
};

const parseControllers = (controllers: Status | undefined): Array<string> | undefined => {
    try {
        if (nonNullish(controllers) && Array.isArray(controllers)) {
            return compactArray(
                controllers.map((v) => {
                    if (v instanceof ArrayBuffer || v instanceof Uint8Array) {
                        return undefined;
                    }
                    try {
                        return v.toText();
                    } catch {
                        return undefined;
                    }
                })
            );
        } else {
            return undefined;
        }
    } catch {
        return undefined;
    }
};

const parseModuleHash = (moduleHash: Status | undefined): string | undefined => {
    try {
        return isNonEmptyString(moduleHash) ? moduleHash : undefined;
    } catch {}
};

const parseSubnetId = (subnet: Status | undefined): string | undefined => {
    try {
        const subnetId = (subnet as SubnetStatus).subnetId;
        return isNonEmptyString(subnetId) ? subnetId : undefined;
    } catch {}
};
