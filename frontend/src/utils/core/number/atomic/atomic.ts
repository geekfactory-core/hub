import {ICPToken} from '@dfinity/utils';
import {formatDecimalString, normalizeInput, roundDecimalString, type FormatOptions} from '../decimal/decimal';
import {formatNumberParts} from '../format';

/**
 * Parses a string/number into a token value (BigInt) considering decimal places.
 */
export const parseAtomicAmount = (input: string | number | undefined | null, atomicPlaces: number): bigint | undefined => {
    const parsed = normalizeInput(input);
    if (!parsed) {
        return undefined;
    }
    const {isNegative, intPart, fracPart} = parsed;
    const fracPadded = (fracPart + '0'.repeat(atomicPlaces)).slice(0, atomicPlaces);
    try {
        const fullStr = intPart + fracPadded;
        const result = BigInt(fullStr || '0');
        return isNegative ? -result : result;
    } catch {
        return undefined;
    }
};

/**
 * Formats a token value (BigInt) to human-readable string using decimal precision.
 */
export const formatAtomicAmount = (value: bigint | undefined | null, atomicPlaces: number, options?: FormatOptions): string | undefined => {
    if (value == undefined || typeof value != 'bigint') {
        return undefined;
    }
    const isNegative = value < 0n;
    const abs = isNegative ? -value : value;
    const str = abs.toString().padStart(atomicPlaces + 1, '0');
    const intPart = str.slice(0, -atomicPlaces) || '0';
    const fracPart = str.slice(-atomicPlaces);
    return formatNumberParts(intPart, fracPart, isNegative, options);
};

export const formatAtomicAmountRounded = (value: bigint | undefined, atomicPlaces: number = ICPToken.decimals, options?: Omit<FormatOptions, 'thousandSeparator'>): string | undefined => {
    const {maxDecimalPlaces, minDecimalPlaces} = options ?? {};
    const rawFormatted = formatAtomicAmount(value, atomicPlaces);
    const rounded = roundDecimalString(rawFormatted, maxDecimalPlaces ?? atomicPlaces);
    return formatDecimalString(rounded, {thousandSeparator: ' ', maxDecimalPlaces, minDecimalPlaces});
};
