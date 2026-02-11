import {applicationLogger} from 'frontend/src/context/logger/logger';
import {usePageFocus} from 'frontend/src/hook/usePageFocus';
import {useProgressivePolling} from 'frontend/src/hook/useProgressivePolling';
import {MILLIS_PER_DAY, MILLIS_PER_SECOND} from 'frontend/src/utils/core/date/constants';
import {useEffect} from 'react';
import {useContractStatusContext} from '../../../context/ContractStatusProvider';

const FETCH_INTERVAL_MILLIS = MILLIS_PER_SECOND * 5;
const FETCH_MAX_INTERVAL_MILLIS = MILLIS_PER_DAY;

export const DeploymentActivationStateAutoFetcher = () => {
    const {fetchContractActivationState} = useContractStatusContext();

    const [isFocused] = usePageFocus({debounceMs: 500});

    const {start, pause, resetPolling, isRunning} = useProgressivePolling({
        baseInterval: FETCH_INTERVAL_MILLIS,
        maxInterval: FETCH_MAX_INTERVAL_MILLIS,
        strategy: 'exponential',
        callback: fetchContractActivationState,
        startMode: 'delayed',
        logger: applicationLogger,
        logMessagePrefix: 'DeploymentActivationStateAutoFetcher[useProgressivePolling]:'
    });

    useEffect(() => {
        if (isFocused && !isRunning) {
            start();
        } else if (!isFocused && isRunning) {
            pause();
            resetPolling('immediate');
        }
    }, [isFocused, start, pause, resetPolling, isRunning]);

    return null;
};
