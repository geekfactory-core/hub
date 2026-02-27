import {describe, expect, it} from 'vitest';
import {addThousandSeparator, applyDecimalPrecision, formatDecimalString, normalizeInput, roundDecimalString} from './decimal';

describe('roundDecimalString', () => {
    it.each([
        {input: '1.23456789', decimalPlaces: 4, expected: '1.2346'},
        {input: '1.23456789', decimalPlaces: 12, expected: '1.23456789'},
        {input: '0.9999999', decimalPlaces: 4, expected: '1'},
        {input: ' 0.9999999 ', decimalPlaces: 12, expected: '0.9999999'},
        {input: '-12.3456', decimalPlaces: 2, expected: '-12.35'},
        {input: '1 000.12', decimalPlaces: 1, expected: '1000.1'},
        {input: Number.MAX_SAFE_INTEGER.toString(), decimalPlaces: 1, expected: '9007199254740991'},
        {input: Number.MIN_SAFE_INTEGER.toString(), decimalPlaces: 1, expected: '-9007199254740991'}
    ])('rounds "$input" to $decimalPlaces places → "$expected"', ({input, decimalPlaces, expected}) => {
        expect(roundDecimalString(input, decimalPlaces)).toBe(expected);
    });

    it.each([
        {input: '1.9999', decimalPlaces: 0, expected: '2'},
        {input: '999.999', decimalPlaces: 0, expected: '1000'},
        {input: '-0.999999', decimalPlaces: 0, expected: '-1'},
        {input: '0.00000051', decimalPlaces: 6, expected: '0.000001'},
        {input: '0.00000049', decimalPlaces: 6, expected: '0'}
    ])('rounds edge case "$input" to $decimalPlaces places → "$expected"', ({input, decimalPlaces, expected}) => {
        expect(roundDecimalString(input, decimalPlaces)).toBe(expected);
    });

    it('strips trailing zeros from fractional part after rounding', () => {
        expect(roundDecimalString('1.90000000', 8)).toBe('1.9');
        expect(roundDecimalString('1.00000000', 8)).toBe('1');
    });

    it.each([
        {label: '"abc"', input: 'abc'},
        {label: 'empty string', input: ''},
        {label: 'bare minus', input: '-'},
        {label: '"1e4"', input: '1e4'},
        {label: 'Number.MAX_VALUE', input: Number.MAX_VALUE},
        {label: 'Number.MIN_VALUE', input: Number.MIN_VALUE},
        {label: 'undefined', input: undefined},
        {label: 'null', input: null},
        {label: 'Symbol', input: Symbol()}
    ] as const)('returns undefined for invalid input: $label', ({input}) => {
        expect(roundDecimalString(input as any, 2)).toBeUndefined();
    });
});

describe('formatDecimalString', () => {
    it('trims and pads fractional parts', () => {
        expect(formatDecimalString('1234567.89000')).toBe('1234567.89');
        expect(formatDecimalString('0.000123000')).toBe('0.000123');
        expect(formatDecimalString('1.2', {minDecimalPlaces: 4})).toBe('1.2000');
        expect(formatDecimalString('1.234567', {maxDecimalPlaces: 2})).toBe('1.23');
        expect(formatDecimalString(Number.MAX_SAFE_INTEGER.toString())).toBe('9007199254740991');
        expect(formatDecimalString(Number.MIN_SAFE_INTEGER.toString())).toBe('-9007199254740991');
    });

    it('applies thousand separator', () => {
        expect(formatDecimalString('1234567.89', {thousandSeparator: ' '})).toBe('1 234 567.89');
        expect(formatDecimalString('1000000', {thousandSeparator: ','})).toBe('1,000,000');
    });

    it('handles min + max decimal places combination', () => {
        expect(formatDecimalString('0.5', {minDecimalPlaces: 3, maxDecimalPlaces: 4})).toBe('0.500');
        expect(formatDecimalString('0.56789', {maxDecimalPlaces: 2, minDecimalPlaces: 4})).toBe('0.5600');
    });

    it('pads integer with minDecimalPlaces', () => {
        expect(formatDecimalString('1000', {minDecimalPlaces: 3})).toBe('1000.000');
    });

    it.each([
        {label: 'empty string', input: ''},
        {label: '"foo"', input: 'foo'},
        {label: 'bare minus', input: '-'},
        {label: 'object', input: {}},
        {label: 'Number.MAX_VALUE', input: Number.MAX_VALUE},
        {label: 'Number.MIN_VALUE', input: Number.MIN_VALUE},
        {label: 'undefined', input: undefined},
        {label: 'null', input: null},
        {label: 'Symbol', input: Symbol()}
    ] as const)('returns undefined for invalid input: $label', ({input}) => {
        expect(formatDecimalString(input as any)).toBeUndefined();
    });
});

describe('applyDecimalPrecision', () => {
    it('trims trailing zeros from fractional part', () => {
        expect(applyDecimalPrecision('120000', {})).toBe('12');
        expect(applyDecimalPrecision('100', {})).toBe('1');
        expect(applyDecimalPrecision('0', {})).toBe('');
    });

    it('pads with zeros to minDecimalPlaces', () => {
        expect(applyDecimalPrecision('12', {minDecimalPlaces: 4})).toBe('1200');
        expect(applyDecimalPrecision('', {minDecimalPlaces: 3})).toBe('000');
    });

    it('handles combination of min/max decimal places', () => {
        expect(applyDecimalPrecision('123456', {minDecimalPlaces: 4, maxDecimalPlaces: 4})).toBe('1234');
        expect(applyDecimalPrecision('1', {minDecimalPlaces: 4, maxDecimalPlaces: 4})).toBe('1000');
        expect(applyDecimalPrecision('123456', {minDecimalPlaces: 6, maxDecimalPlaces: 6})).toBe('123456');
    });

    it('cuts extra digits with maxDecimalPlaces', () => {
        expect(applyDecimalPrecision('123456', {maxDecimalPlaces: 3})).toBe('123');
        expect(applyDecimalPrecision('123456', {maxDecimalPlaces: 0})).toBe('');
    });

    it('returns value unchanged when within min/max bounds', () => {
        expect(applyDecimalPrecision('1234', {minDecimalPlaces: 3, maxDecimalPlaces: 6})).toBe('1234');
    });
});

describe('normalizeInput', () => {
    it.each([
        {label: '"123.456"', input: '123.456', expected: {isNegative: false, intPart: '123', fracPart: '456'}},
        {label: '"-0.5"', input: '-0.5', expected: {isNegative: true, intPart: '0', fracPart: '5'}},
        {label: '"1." (trailing)', input: '1.', expected: {isNegative: false, intPart: '1', fracPart: ''}},
        {label: '".5" (leading)', input: '.5', expected: {isNegative: false, intPart: '0', fracPart: '5'}},
        {label: '1.12 (number)', input: 1.12, expected: {isNegative: false, intPart: '1', fracPart: '12'}},
        {label: '1e10 (number)', input: 1e10, expected: {isNegative: false, intPart: '10000000000', fracPart: ''}},
        {label: 'MAX_SAFE_INTEGER', input: Number.MAX_SAFE_INTEGER, expected: {isNegative: false, intPart: '9007199254740991', fracPart: ''}},
        {label: 'MIN_SAFE_INTEGER', input: Number.MIN_SAFE_INTEGER, expected: {isNegative: true, intPart: '9007199254740991', fracPart: ''}},
        {label: '1n (bigint)', input: 1n, expected: {isNegative: false, intPart: '1', fracPart: ''}},
        {label: 'BigInt(1e10)', input: BigInt(1e10), expected: {isNegative: false, intPart: '10000000000', fracPart: ''}}
    ])('parses $label to normalized parts', ({input, expected}) => {
        expect(normalizeInput(input as any)).toEqual(expected);
    });

    it('strips thousand separators (space, comma, apostrophe)', () => {
        expect(normalizeInput("1'000.45")).toEqual({isNegative: false, intPart: '1000', fracPart: '45'});
        expect(normalizeInput('1 000,45')).toEqual({isNegative: false, intPart: '1000', fracPart: '45'});
    });

    it.each([
        {label: 'empty string', input: ''},
        {label: '"foo"', input: 'foo'},
        {label: 'bare minus', input: '-'},
        {label: '"NaN"', input: 'NaN'},
        {label: '"1e4"', input: '1e4'},
        {label: 'Number.MAX_VALUE', input: Number.MAX_VALUE},
        {label: 'Number.MIN_VALUE', input: Number.MIN_VALUE},
        {label: '1e20', input: 1e20},
        {label: 'BigInt(1e20)', input: BigInt(1e20)},
        {label: 'undefined', input: undefined},
        {label: 'null', input: null},
        {label: 'Symbol', input: Symbol()},
        {label: 'Infinity', input: Number.POSITIVE_INFINITY}
    ] as const)('returns undefined for invalid input: $label', ({input}) => {
        expect(normalizeInput(input as any)).toBeUndefined();
    });
});

describe('addThousandSeparator', () => {
    it('inserts thousand separator into long numbers', () => {
        expect(addThousandSeparator('1000', ' ')).toBe('1 000');
        expect(addThousandSeparator('1234567', ',')).toBe('1,234,567');
        expect(addThousandSeparator('1234567890', '_')).toBe('1_234_567_890');
        expect(addThousandSeparator(Number.MAX_SAFE_INTEGER.toString(), '_')).toBe('9_007_199_254_740_991');
    });

    it('leaves numbers with 3 or fewer digits unchanged', () => {
        expect(addThousandSeparator('12', ',')).toBe('12');
        expect(addThousandSeparator('123', ',')).toBe('123');
    });
});
