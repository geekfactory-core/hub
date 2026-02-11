import {formatNumberParts} from '../format';

/**
 * Format options shared across formatting functions
 */
export interface FormatOptions {
    thousandSeparator?: string;
    minDecimalPlaces?: number;
    maxDecimalPlaces?: number;
}

/**
 * Rounds a decimal string/number to fixed precision.
 */
export const roundDecimalString = (input: string | number | undefined | null, decimalPlaces: number = 2): string | undefined => {
    const parsed = normalizeInput(input);
    if (parsed == undefined) {
        return undefined;
    }
    const {isNegative, intPart, fracPart} = parsed;
    if (decimalPlaces == 0) {
        const roundDigit = Number(fracPart[0] || '0');
        const base = BigInt(intPart || '0');
        const rounded = base + BigInt(roundDigit >= 5 ? 1 : 0);
        return (isNegative ? '-' : '') + rounded.toString();
    }
    const combined = (intPart + fracPart + '0'.repeat(decimalPlaces + 1)).padStart(intPart.length + decimalPlaces + 1, '0');
    const keep = combined.slice(0, intPart.length + decimalPlaces);
    const roundDigit = combined.charAt(intPart.length + decimalPlaces);
    let rounded = BigInt(keep);
    if (roundDigit >= '5') {
        rounded += 1n;
    }
    const full = rounded.toString().padStart(decimalPlaces + 1, '0');
    const finalInt = full.slice(0, -decimalPlaces);
    const finalFrac = full.slice(-decimalPlaces).replace(/0+$/, '');

    const result = finalFrac ? `${finalInt}.${finalFrac}` : finalInt;
    return isNegative ? `-${result}` : result;
};

/**
 * Formats a decimal string/number with optional thousand separator and precision.
 */
export const formatDecimalString = (input: string | number | bigint | undefined | null, options?: FormatOptions): string | undefined => {
    const parsed = normalizeInput(input);
    if (parsed == undefined) {
        return undefined;
    }
    const {isNegative, intPart, fracPart} = parsed;
    return formatNumberParts(intPart, fracPart, isNegative, options);
};

/**
 * Converts input string/number into structured int/fraction parts with sign.
 */
export const normalizeInput = (input: string | number | bigint | undefined | null): {isNegative: boolean; intPart: string; fracPart: string} | undefined => {
    if (input == null) {
        return undefined;
    }

    if (typeof input === 'number') {
        if (!Number.isFinite(input)) {
            return undefined;
        }
        if (input < Number.MIN_SAFE_INTEGER || input > Number.MAX_SAFE_INTEGER) {
            return undefined;
        }
    } else if (typeof input === 'bigint') {
        if (input < BigInt(Number.MIN_SAFE_INTEGER) || input > BigInt(Number.MAX_SAFE_INTEGER)) {
            return undefined;
        }
    } else if (typeof input !== 'string' && typeof input !== 'bigint') {
        return undefined;
    }

    const str = String(input).trim().replace(',', '.').replace(/[' ]/g, '');
    if (!/[0-9]/.test(str)) {
        return undefined;
    }

    const match = /^(-)?(\d*)(?:\.(\d*))?$/.exec(str);
    if (!match) {
        return undefined;
    }

    const [, sign, intRaw = '', fracRaw = ''] = match;
    if (!intRaw && !fracRaw) {
        return undefined;
    }

    return {
        isNegative: !!sign,
        intPart: intRaw || '0',
        fracPart: fracRaw || ''
    };
};

/**
 * Adds a thousand separators to integer string.
 */
export const addThousandSeparator = (intPart: string, separator: string): string => {
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
};

/**
 * Trims or pads fractional part based on min/max decimal options.
 */
export const applyDecimalPrecision = (frac: string, options?: FormatOptions): string => {
    /**
     * always trim trailing zeros first
     */
    frac = frac.replace(/0+$/, '');

    /**
     * enforce max
     */
    if (options?.maxDecimalPlaces != undefined) {
        frac = frac.slice(0, options.maxDecimalPlaces);
    }

    /**
     * enforce min
     */
    if (options?.minDecimalPlaces != undefined) {
        frac = frac.padEnd(options.minDecimalPlaces, '0');
    }

    return frac;
};
