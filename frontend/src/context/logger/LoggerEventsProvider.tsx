import {toError} from 'frontend/src/utils/core/error/toError';
import {type Feature, useFeature} from 'frontend/src/utils/core/feature/feature';
import {delayPromise} from 'frontend/src/utils/core/promise/promiseUtils';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import type {LogEntry} from 'frontend/src/utils/logger/Logger';
import {createContext, type PropsWithChildren, useContext, useMemo, useState} from 'react';
import {apiLogger, applicationLogger} from './logger';

type Context = {
    loggerEvents: Array<LogEntry>;
    feature: Feature;
    fetchLoggerEvents: () => Promise<void>;
};

const Context = createContext<Context | undefined>(undefined);
export const useLoggerEventsProviderContext = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useLoggerEventsProviderContext must be used within a LoggerEventsProvider');
    }
    return context;
};

export const LoggerEventsProvider = (props: PropsWithChildren) => {
    const [loggerEvents, setLoggerEvents] = useState<Array<LogEntry>>([]);
    const [feature, updateFeature] = useFeature();

    const fetchLoggerEvents = useMemo(
        () =>
            reusePromiseWrapper(async () => {
                const logMessagePrefix = 'fetchLoggerEvents:';
                try {
                    updateFeature({status: {inProgress: true}});
                    await delayPromise(300);

                    apiLogger.log(`${logMessagePrefix} request`);
                    // eslint-disable-next-line react-hooks/purity
                    const fetchStart = performance.now();
                    const events = applicationLogger.getAllMessages().reverse();
                    // eslint-disable-next-line react-hooks/purity
                    const fetchDuration = Number.parseFloat((performance.now() - fetchStart).toFixed(2));
                    apiLogger.log(`${logMessagePrefix} response[${fetchDuration}ms]`, {numberOfEvents: events.length});
                    setLoggerEvents(events);
                    updateFeature({
                        status: {inProgress: false, loaded: true},
                        error: {isError: false, error: undefined}
                    });
                } catch (e) {
                    apiLogger.error(`${logMessagePrefix} error`, e);
                    updateFeature({
                        status: {inProgress: false, loaded: true},
                        error: {isError: true, error: toError(e)}
                    });
                }
            }),
        [updateFeature]
    );

    const value: Context = useMemo(
        () => ({
            loggerEvents,
            feature,
            fetchLoggerEvents
        }),
        [loggerEvents, feature, fetchLoggerEvents]
    );

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};
