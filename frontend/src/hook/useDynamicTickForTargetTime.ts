import {isNullish} from '@dfinity/utils';
import {useDynamicTick} from 'frontend/src/hook/useDynamicTick';
import {useMemo} from 'react';

export const useDynamicTickForTargetTime = (expiration: bigint | undefined, offsetMillis?: Array<number>): {targetTimeMillis: number | undefined; tick: number} => {
    const targetTimeMillis = useMemo(() => {
        if (isNullish(expiration)) {
            return undefined;
        }
        return Number(expiration);
    }, [expiration]);

    const tick = useDynamicTick(targetTimeMillis, offsetMillis);

    return {targetTimeMillis, tick};
};
