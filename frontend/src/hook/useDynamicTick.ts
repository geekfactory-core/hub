import {isNullish} from '@dfinity/utils';
import {useEffect, useState} from 'react';
import {isEmptyArray} from '../utils/core/array/array';
import {MILLIS_PER_MINUTE, MILLIS_PER_SECOND} from '../utils/core/date/constants';

/* eslint-disable */
/**
 * Hook for dynamic tick updates based on target time and optional time offsets.
 *
 * @param targetTimeMillis - The target time in milliseconds
 * @param offsetMillis - Array of time offsets in milliseconds before targetTimeMillis to consider for interval calculation
 * @returns tick counter that increments at dynamic intervals
 *
 * @example
 * // For certificate expiration with 20 and 15 minute warnings:
 * const tick = useDynamicTick(certificateEndTime, [20 * MILLIS_PER_MINUTE, 15 * MILLIS_PER_MINUTE]);
 * // This will calculate intervals based on the closest upcoming time point (20min, 15min, or end)
 */
/* eslint-enable */
export const useDynamicTick = (targetTimeMillis?: number, offsetMillis?: Array<number>): number => {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (isNullish(targetTimeMillis)) {
            setTick(0);
            return;
        }
        const now = Date.now();
        // Find the closest upcoming time point (offset or target)
        const msToClosestPoint = findClosestTimePoint(now, targetTimeMillis, offsetMillis);
        const interval = calculateNextInterval(msToClosestPoint);
        if (interval > 0) {
            const timeout = setTimeout(() => {
                setTick((prev) => prev + 1);
            }, interval);
            return () => clearTimeout(timeout);
        }
        return;
    }, [tick, targetTimeMillis, offsetMillis]);

    return tick;
};

/**
 * Finds the time in milliseconds to the closest upcoming time point.
 * Considers both the target time and any offsets before it.
 */
const findClosestTimePoint = (now: number, targetTimeMillis: number, offsetMillis?: Array<number>): number => {
    if (isEmptyArray(offsetMillis)) {
        return targetTimeMillis - now;
    }

    // Calculate all time points (offsets + target)
    const timePoints = [targetTimeMillis, ...offsetMillis.map((offset) => targetTimeMillis - offset)];

    // Find the closest future time point by sorting
    const futurePoints = timePoints
        .map((point) => point - now)
        .filter((ms) => ms > 0)
        .sort((a, b) => a - b);

    if (isEmptyArray(futurePoints)) {
        // All points are in the past, return time to target
        return targetTimeMillis - now;
    }

    // Return the smallest positive difference (first element after sorting)
    return futurePoints[0];
};

const calculateNextInterval = (millisLeft: number): number => {
    if (millisLeft > 30 * MILLIS_PER_MINUTE) {
        /**
         * more than 30 minutes left, will return 5 minutes interval
         */
        return 5 * MILLIS_PER_MINUTE;
    }
    if (millisLeft > 10 * MILLIS_PER_MINUTE) {
        /**
         * more than 10 minutes left, will return 1 minute interval
         */
        return 1 * MILLIS_PER_MINUTE;
    }
    if (millisLeft > 3 * MILLIS_PER_MINUTE) {
        /**
         * more than 3 minutes left, will return 10 seconds interval
         */
        return 10 * MILLIS_PER_SECOND;
    }
    if (millisLeft > MILLIS_PER_MINUTE) {
        /**
         * more than 1 minute left, will return 5 seconds interval
         */
        return 5 * MILLIS_PER_SECOND;
    }
    if (millisLeft > 0) {
        /**
         * less than 1 minute left, will return 1 second interval
         */
        return MILLIS_PER_SECOND;
    }
    return -1;
};
