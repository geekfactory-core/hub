import {CMCCanister} from '@dfinity/cmc';
import {assertNonNullish, nonNullish} from '@dfinity/utils';
import {useICCanisterCallHubAnonymous} from 'frontend/src/api/hub/useICCallHub';
import {DEFAULT_CONTRACT_URL_PATTERN} from 'frontend/src/constants';
import {toError} from 'frontend/src/utils/core/error/toError';
import {type DataAvailability, type Feature} from 'frontend/src/utils/core/feature/feature';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {safeCall} from 'frontend/src/utils/ic/api/safeCall';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {useCallback, useMemo, useState} from 'react';
import type {Config} from 'src/declarations/hub/hub.did';
import {useAgentContext} from '../../agent/AgentProvider';
import {apiLogger, applicationLogger} from '../../logger/logger';
import {caughtErrorMessage} from '../../logger/loggerConstants';

type FetchConfigOptions = {fetchConversionRate?: boolean};
type HubConfigDataAvailability = DataAvailability<{hubConfig: Config}>;

type ConversionRateDataAvailability = DataAvailability<{xdrPermyriadPerIcp: bigint}, {error?: Error}>;

type Context = {
    feature: Feature;
    fetchHubConfig: (options?: FetchConfigOptions) => Promise<void>;
    hubDataAvailability: HubConfigDataAvailability;

    conversionRateDataAvailability: ConversionRateDataAvailability | undefined;

    isDeploymentAllowedOnTheBackend: boolean;
    buildContractURL: (canisterId: string) => string;
};

export const useHubConfig = (): Context => {
    const {getAnonymousAgent} = useAgentContext();
    const {call, data, feature} = useICCanisterCallHubAnonymous('getConfig');
    const hubConfig = data?.config;

    const [conversionRateDataAvailability, setConversionRateDataAvailability] = useState<ConversionRateDataAvailability | undefined>();

    const fetchHubConfig = useMemo(
        () =>
            reusePromiseWrapper(async (options?: FetchConfigOptions) => {
                const logMessagePrefix = `useHubConfig:`;

                applicationLogger.debug(`${logMessagePrefix} fetchHubConfig: started`, {options});
                await call([], {
                    logger: apiLogger,
                    logMessagePrefix,
                    onResponseErrorBeforeExit: async (responseError) => {
                        throw toError(getICFirstKey(responseError));
                    },
                    onResponseOkBeforeExit: async (responseOk) => {
                        try {
                            applicationLogger.debug(`${logMessagePrefix} fetchHubConfig: onResponseOkBeforeExit`, responseOk);
                            applicationLogger.debug(`${logMessagePrefix} fetchHubConfig: options`, options);
                            /**
                             * Optionally fetch conversion rate
                             */
                            if (options?.fetchConversionRate) {
                                const anonymousAgent = await getAnonymousAgent();
                                assertNonNullish(anonymousAgent, 'noAnonymousAgent');

                                /**
                                 * Fetch conversion rate
                                 */
                                const fetchConversionRate = async () => {
                                    const icpXdrConversionRateStrategy = responseOk.config.icp_xdr_conversion_rate_strategy;
                                    applicationLogger.debug(`${logMessagePrefix} fetchHubConfig: fetching conversion rate: preparing with strategy`, icpXdrConversionRateStrategy);
                                    if (hasProperty(icpXdrConversionRateStrategy, 'Fixed')) {
                                        setConversionRateDataAvailability({type: 'available', xdrPermyriadPerIcp: icpXdrConversionRateStrategy.Fixed.xdr_permyriad_per_icp});
                                    } else if (hasProperty(icpXdrConversionRateStrategy, 'CMC')) {
                                        applicationLogger.debug(`${logMessagePrefix} fetchHubConfig: fetching conversion rate: using CMC strategy`);
                                        const canisterId = icpXdrConversionRateStrategy.CMC.cmc_canister;
                                        const actor = CMCCanister.create({
                                            agent: anonymousAgent,
                                            canisterId: canisterId
                                        });
                                        assertNonNullish(actor, 'noActor');

                                        /**
                                         * There is no "loading" state by design here for the conversion rate
                                         */
                                        const call = safeCall(actor.getIcpToCyclesConversionRate, {
                                            logger: apiLogger,
                                            logMessagePrefix: `useIcpXdrConversionRate:`,
                                            argsToLog: [{canisterId: canisterId.toText()}]
                                        });
                                        applicationLogger.debug(`${logMessagePrefix} fetchHubConfig: fetching conversion rate: calling CMC canister`, {canisterId: canisterId.toText()});
                                        const response = await call();
                                        applicationLogger.debug(`${logMessagePrefix} fetchHubConfig: fetching conversion rate: CMC canister responded`, response);
                                        if (hasProperty(response, 'Ok')) {
                                            setConversionRateDataAvailability({type: 'available', xdrPermyriadPerIcp: response.Ok});
                                        } else {
                                            setConversionRateDataAvailability({type: 'notAvailable', error: response.Thrown});
                                        }
                                        return response;
                                    }
                                };

                                try {
                                    applicationLogger.debug(`${logMessagePrefix} fetchHubConfig: fetching conversion rate`);
                                    const response = await fetchConversionRate();
                                    applicationLogger.debug(`${logMessagePrefix} fetchHubConfig: conversion rate fetched`, response);
                                } catch (e) {
                                    const error = toError(e);
                                    apiLogger.error(caughtErrorMessage(`${logMessagePrefix} fetchConversionRate`), error);
                                    setConversionRateDataAvailability({type: 'notAvailable', error});
                                }
                            }
                        } catch (e) {
                            apiLogger.error(caughtErrorMessage(`${logMessagePrefix} onResponseOkBeforeExit`), e);
                        }
                    }
                });
                applicationLogger.debug(`${logMessagePrefix} fetchHubConfig: completed`);
            }),
        [call, getAnonymousAgent]
    );

    const buildContractURL = useCallback(
        (canisterId: string) => {
            const pattern = hubConfig?.contract_url_pattern ?? DEFAULT_CONTRACT_URL_PATTERN;
            return pattern.replace('{principal}', canisterId);
        },
        [hubConfig?.contract_url_pattern]
    );

    const hubDataAvailability: HubConfigDataAvailability = useMemo(() => {
        if (feature.status.loaded) {
            if (nonNullish(hubConfig)) {
                return {type: 'available', hubConfig};
            }
            return {type: 'notAvailable'};
        }
        return {type: 'loading'};
    }, [feature.status.loaded, hubConfig]);

    const isDeploymentAllowedOnTheBackend = hubConfig?.is_deployment_available == true;

    return useMemo(
        () => ({
            feature,
            fetchHubConfig,
            hubDataAvailability,

            conversionRateDataAvailability,

            isDeploymentAllowedOnTheBackend,
            buildContractURL
        }),
        [feature, fetchHubConfig, hubDataAvailability, conversionRateDataAvailability, isDeploymentAllowedOnTheBackend, buildContractURL]
    );
};
