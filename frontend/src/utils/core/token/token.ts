import {isNullish, type Token} from '@dfinity/utils';
import {formatAtomicAmountRounded} from '../number/atomic/atomic';
import type {FormatOptions} from '../number/decimal/decimal';

/**
==========================================
Formatting
==========================================
*/

export const formatTokenAmount = (value: bigint | undefined, token: Token, options?: {fallback?: string} & Omit<FormatOptions, 'thousandSeparator'>): string => {
    const {fallback = '-', maxDecimalPlaces = token.decimals, minDecimalPlaces} = options ?? {};
    const formattedAmount = _formatTokenAmount(value, token, {maxDecimalPlaces, minDecimalPlaces});
    if (isNullish(formattedAmount)) {
        return fallback;
    }
    return formattedAmount;
};

export const formatTokenAmountWithSymbol = (value: bigint | undefined, token: Token, options?: {fallback?: string} & Omit<FormatOptions, 'thousandSeparator'>): string => {
    const {fallback = '-', maxDecimalPlaces = token.decimals, minDecimalPlaces} = options ?? {};
    const formattedAmount = _formatTokenAmount(value, token, {maxDecimalPlaces, minDecimalPlaces});
    if (isNullish(formattedAmount)) {
        return fallback;
    }
    return `${formattedAmount} ${token.symbol}`;
};

const _formatTokenAmount = (value: bigint | undefined, token: Token, options?: Omit<FormatOptions, 'thousandSeparator'>): string | undefined => {
    const {maxDecimalPlaces = token.decimals, minDecimalPlaces} = options ?? {};
    const formattedAmount = formatAtomicAmountRounded(value, token.decimals, {maxDecimalPlaces, minDecimalPlaces});
    if (isNullish(formattedAmount)) {
        return undefined;
    }
    return formattedAmount;
};

/**
 * Format token amount like NNS app (https://nns.ic0.app/)
 * - Show 8 decimal places for amounts less than 0.01
 * - Show 2 decimal places for amounts 0.01 or more
 * - Show "-" for undefined values
 * - Show "0" for zero values
 */
export const formatNNSTokenAmount = (value: bigint | undefined, token: Token, options?: {fallback?: string}): string => {
    const {fallback = '-'} = options ?? {};
    if (value == undefined) {
        return fallback;
    }
    if (value == 0n) {
        return '0';
    }
    /**
     * Check for amount less than 0.01
     */
    if (value < BigInt(10 ** (token.decimals - 2))) {
        return formatTokenAmount(value, token, {maxDecimalPlaces: 8, fallback});
    }
    /**
     * Amount is 0.01 or more
     */
    return formatTokenAmount(value, token, {maxDecimalPlaces: 2, minDecimalPlaces: 2, fallback});
};
