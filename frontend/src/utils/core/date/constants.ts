const NANOS_PER_MILLI = 1_000_000;

export const MILLIS_PER_SECOND: number = 1_000;
export const MILLIS_PER_MINUTE: number = 60 * MILLIS_PER_SECOND;
const MILLIS_PER_HOUR: number = 60 * MILLIS_PER_MINUTE;
export const MILLIS_PER_DAY: number = 24 * MILLIS_PER_HOUR;

export const millisToNanos = (millis: bigint): bigint => {
    return millis * BigInt(NANOS_PER_MILLI);
};

export const nanosToMillis = (nanos: bigint): bigint => {
    return nanos / BigInt(NANOS_PER_MILLI);
};
