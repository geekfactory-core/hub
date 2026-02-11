import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {Logger} from '../utils/logger/Logger';

type BuiltInStrategy = 'linear' | 'exponential';
type StrategyFn = (attempt: number, baseInterval: number) => number;
type Strategy = BuiltInStrategy | StrategyFn;
type StartMode = 'immediate' | 'delayed';

// -----------------------------------------------------------------------------
// This file was generated with the help of AI (ChatGPT).
// -----------------------------------------------------------------------------

interface UseProgressivePollingOptions {
    // Initial interval between polling attempts
    baseInterval: number;
    // Optional cap for the polling interval
    maxInterval?: number;
    // Determines the backoff strategy
    strategy?: Strategy;
    // Function called on each polling iteration
    callback: () => void | Promise<void>;
    // Optional error handler
    onError?: (error: unknown) => void;
    // Defines whether polling starts immediately or with a delay
    startMode?: StartMode;
    // Optional logger for debugging
    logger?: Logger;
    // Optional prefix for log messages
    logMessagePrefix?: string;
}

interface UseProgressivePollingReturn {
    // Begins the polling process
    start: () => void;
    // Temporarily halts polling
    pause: () => void;
    // Resets internal state
    resetPolling: (nextStartMode?: StartMode) => void;
    // Indicates if polling is currently active
    isRunning: boolean;
}

// Converts a strategy value into a usable function
function getStrategyFunction(strategy: Strategy, maxInterval: number): StrategyFn {
    if (typeof strategy === 'function') {
        return strategy;
    }

    switch (strategy) {
        case 'linear':
            // Increase interval linearly: base + attempt * 1000ms
            return (attempt, base) => Math.min(base + attempt * 1000, maxInterval);
        case 'exponential':
        default:
            // Increase interval exponentially: base * 2^attempt
            return (attempt, base) => Math.min(base * 2 ** attempt, maxInterval);
    }
}

/* eslint-disable */
/**
 * Progressive polling React hook.
 *
 * @example
 * // Base interval = 1000ms
 *
 * // Linear strategy:
 * //   attempt=0 → 1000ms
 * //   attempt=1 → 2000ms
 * //   attempt=2 → 3000ms
 * //   attempt=3 → 4000ms
 *
 * // Exponential strategy:
 * //   attempt=0 → 1000ms
 * //   attempt=1 → 2000ms
 * //   attempt=2 → 4000ms
 * //   attempt=3 → 8000ms
 *
 * // Custom strategy:
 *    const customStrategy = (attempt: number, base: number) =>
 *      Math.min(base + attempt * 500, maxInterval);
 */
/* eslint-enable */
export function useProgressivePolling({
    baseInterval,
    maxInterval = 60000,
    strategy = 'exponential',
    callback,
    onError,
    startMode = 'delayed',
    logger,
    logMessagePrefix = 'useProgressivePolling:'
}: UseProgressivePollingOptions): UseProgressivePollingReturn {
    // State to track if polling is active
    const [running, setRunning] = useState(false);
    // Ref to track running state for use in async callbacks
    const runningRef = useRef(false);
    // Tracks the number of polling attempts
    const attemptRef = useRef(0);
    // Stores timer ID
    const timerRef = useRef<number | null>(null);
    // Memoized strategy function
    const strategyFn = useRef(getStrategyFunction(strategy, maxInterval));
    // Memoized start mode
    const startModeRef = useRef<StartMode>(startMode);
    // Ref to hold the tick function so it can call itself
    const tickRef = useRef<() => Promise<void>>();

    // Clears any active polling timeout
    const clearTimer = useCallback(() => {
        if (timerRef.current != undefined) {
            clearTimeout(timerRef.current);
            logger?.debug(`${logMessagePrefix} Cleared existing timer`);
            timerRef.current = null;
        }
    }, [logMessagePrefix, logger]);

    // Executes the callback and schedules the next polling attempt
    const tick = useCallback(async () => {
        logger?.debug(`${logMessagePrefix} Tick started`, {attempt: attemptRef.current});

        try {
            // Execute polling callback
            await callback();
            logger?.debug(`${logMessagePrefix} Callback executed successfully`, {attempt: attemptRef.current});
        } catch (err) {
            // Forward errors to user-defined handler
            onError?.(err);
            logger?.error(`${logMessagePrefix} Callback threw error`, err);
        }

        // Calculate next interval
        const interval = strategyFn.current(attemptRef.current, baseInterval);
        logger?.debug(`${logMessagePrefix} Next interval calculated`, {interval, attempt: attemptRef.current});

        // Increment attempt count
        attemptRef.current += 1;

        // Schedule next tick only if still running
        if (tickRef.current && runningRef.current) {
            timerRef.current = window.setTimeout(tickRef.current, interval);
            logger?.debug(`${logMessagePrefix} Next tick scheduled`, {interval});
        } else if (!runningRef.current) {
            logger?.debug(`${logMessagePrefix} Skipping next tick schedule - polling stopped`);
        }
    }, [baseInterval, callback, logMessagePrefix, logger, onError]);

    // Update the ref whenever tick changes
    useEffect(() => {
        tickRef.current = tick;
    }, [tick]);

    // Sync runningRef with running state
    useEffect(() => {
        runningRef.current = running;
    }, [running]);

    // Starts polling depending on the chosen start mode
    const start = useCallback(() => {
        if (!running) {
            // Clear any existing timer
            clearTimer();
            // Reset attempt count
            attemptRef.current = 0;
            // Mark as running
            runningRef.current = true;
            setRunning(true);

            const mode = startModeRef.current;
            logger?.debug(`${logMessagePrefix} Polling started`, {mode, baseInterval});

            if (mode == 'immediate') {
                // Run the callback right away
                logger?.debug(`${logMessagePrefix} Executing first tick immediately`);
                tick();
            } else {
                // Schedule the first tick with calculated delay
                const interval = strategyFn.current(0, baseInterval);
                attemptRef.current = 1;
                timerRef.current = window.setTimeout(tick, interval);
                logger?.debug(`${logMessagePrefix} First tick scheduled with delay`, {interval});
            }
        }
    }, [baseInterval, clearTimer, logMessagePrefix, logger, running, tick]);

    // Pauses polling by clearing the active timer and flag
    const pause = useCallback(() => {
        runningRef.current = false;
        setRunning(false);
        clearTimer();
        logger?.debug(`${logMessagePrefix} Polling paused`);
    }, [clearTimer, logMessagePrefix, logger]);

    // Fully resets attempt counter and optionally changes start mode
    const resetPolling = useCallback(
        (nextStartMode?: StartMode) => {
            attemptRef.current = 0;
            if (nextStartMode) {
                startModeRef.current = nextStartMode;
                logger?.debug(`${logMessagePrefix} Polling reset with new start mode`, {nextStartMode});
            } else {
                logger?.debug(`${logMessagePrefix} Polling reset`);
            }
        },
        [logMessagePrefix, logger]
    );

    // Ensures timer is cleared on component unmount
    useEffect(() => {
        return () => {
            runningRef.current = false;
            clearTimer();
            logger?.debug(`${logMessagePrefix} Polling cleanup on unmount`);
        };
    }, [clearTimer, logMessagePrefix, logger]);

    return useMemo(
        () => ({
            start,
            pause,
            resetPolling,
            isRunning: running
        }),
        [start, pause, resetPolling, running]
    );
}
