import {isNullish} from '@dfinity/utils';
import type {ValueWithUnit} from '../number/types';

const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

export const convertBytesFractionalAdaptive = (bytes: bigint | undefined): ValueWithUnit | undefined => {
    if (isNullish(bytes) || bytes < 0n) {
        return undefined;
    }

    let value = Number(bytes);
    let index = 0;

    while (index < units.length - 1 && value >= 1024) {
        value /= 1024;
        index++;
    }

    return {value, unit: units[index]};
};
