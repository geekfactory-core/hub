import {applicationLogger} from 'frontend/src/context/logger/logger';
import {usePageFocus} from 'frontend/src/hook/usePageFocus';
import {useProgressivePolling} from 'frontend/src/hook/useProgressivePolling';
import {MILLIS_PER_DAY, MILLIS_PER_SECOND} from 'frontend/src/utils/core/date/constants';
import {useEffect} from 'react';
import {useDeployContractModalDataContext} from './DeployContractModalDataProvider';

const FETCH_INTERVAL_MILLIS = MILLIS_PER_SECOND * 30;
const FETCH_MAX_INTERVAL_MILLIS = MILLIS_PER_DAY;

export const ConversionRateAutoFetcher = () => {
    const {
        requiredData: {fetchHubConfigWithConversionRate},
        deploymentActionInProgress
    } = useDeployContractModalDataContext();

    const [isFocused] = usePageFocus({debounceMs: 500});

    const {
        start,
        pause,
        resetPolling,
        isRunning: isPollingRunning
    } = useProgressivePolling({
        baseInterval: FETCH_INTERVAL_MILLIS,
        maxInterval: FETCH_MAX_INTERVAL_MILLIS,
        strategy: (attempt, base) => Math.min(base * 2 ** (attempt / 2), FETCH_MAX_INTERVAL_MILLIS),
        callback: async () => {
            await fetchHubConfigWithConversionRate();
        },
        startMode: 'delayed',
        logger: applicationLogger,
        logMessagePrefix: 'ConversionRateAutoFetcher[useProgressivePolling]:'
    });

    useEffect(() => {
        /**
         * Polling can start only when the page is focused and no deployment is in progress
         */
        const canStartPolling = isFocused && !deploymentActionInProgress;

        /**
         * Start polling if allowed and not already running
         */
        if (canStartPolling && !isPollingRunning) {
            start();
            return;
        }

        /**
         * Stop polling if user unfocused or deployment started
         */
        const shouldStopPolling = !isFocused || deploymentActionInProgress;
        if (shouldStopPolling && isPollingRunning) {
            pause();
            resetPolling('immediate');
        }
    }, [isFocused, deploymentActionInProgress, isPollingRunning, start, pause, resetPolling]);

    return null;
};
