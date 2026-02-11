import {isNullish} from '@dfinity/utils';

/**
 * Returns the duration in milliseconds until the specified UTC time.
 * If the input is nullish, it returns 0.
 *
 * @param utcMillis - The UTC time in milliseconds as a bigint or number.
 * @returns The duration in milliseconds until the specified UTC time. If input is in the past, it returns a negative value.
 */
export const getDurationTillUTCMillisUnsafe = (utcMillis: bigint | number | undefined): number => {
    if (isNullish(utcMillis)) {
        return 0;
    }
    return Number(utcMillis) - Date.now();
};
