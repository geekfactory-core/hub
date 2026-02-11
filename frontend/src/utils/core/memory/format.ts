import {formatValueWithUnit, type Options} from '../number/format';
import type {ValueWithUnit} from '../number/types';
import {convertBytesFractionalAdaptive} from './convert';

const UNIT_SPACE = ' ';
const DECIMAL_PLACES = 2;

export const formatMemoryBytes = (bytes: bigint | undefined, options?: Options): string => {
    return formatMemoryBytesValueWithUnit(convertBytesFractionalAdaptive(bytes), options);
};

export const formatMemoryBytesValueWithUnit = (valueWithUnit: ValueWithUnit | undefined, options?: Options): string => {
    const {decimalPlaces = DECIMAL_PLACES, fallback} = options || {};
    return formatValueWithUnit(valueWithUnit, {decimalPlaces, fallback, unitSpace: UNIT_SPACE});
};
