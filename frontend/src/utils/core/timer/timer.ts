import {getDurationTillUTCMillisUnsafe} from '../date/duration';

/**
 * Maximum timeout limit for setTimeout and setInterval
 * The maximum value is 2^31 - 1 (2147483647) milliseconds, which is approximately 24.8 days.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value
 */
const MAX_TIMEOUT_LIMIT = 2 ** 31 - 1;

/**
 * Returns a safe timeout value for setTimeout and setInterval.
 * The value is clamped to be between 0 and MAX_TIMEOUT_LIMIT.
 * @param durationMillis - The desired timeout value in milliseconds.
 * @returns A safe timeout value.
 */
export const getSafeTimerTimeout = (durationMillis: number) => {
    return Math.min(Math.max(0, durationMillis), MAX_TIMEOUT_LIMIT);
};

/**
 * Calculates the delay in milliseconds until a specified UTC time safely capped to prevent browser timer issues.
 *
 * @param utcMillis - The target UTC time in milliseconds as a bigint, number, or undefined
 * @returns The delay in milliseconds, safely capped to prevent browser timer issues.
 *          Returns 0 if the input is nullish or the target time is in the past.
 */

export const getSafeTimerTimeoutTillUTCMillis = (utcMillis: bigint | number | undefined): number => getSafeTimerTimeout(getDurationTillUTCMillisUnsafe(utcMillis));
