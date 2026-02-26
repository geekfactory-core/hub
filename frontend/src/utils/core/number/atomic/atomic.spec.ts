import {describe, expect, it} from 'vitest';
import {formatAtomicAmount, parseAtomicAmount} from './atomic';

const decimals = 8;

describe('parseAtomicAmount', () => {
    it.each([
        {label: '"1"', input: '1', expected: '100000000'},
        {label: '"1.23"', input: '1.23', expected: '123000000'},
        {label: '"0.00000001"', input: '0.00000001', expected: '1'},
        {label: '"1,23" (comma)', input: '1,23', expected: '123000000'},
        {label: '"-0.5"', input: '-0.5', expected: '-50000000'},
        {label: '"0001.2300"', input: '0001.2300', expected: '123000000'},
        {label: '"10 001.2300"', input: '10 001.2300', expected: '1000123000000'},
        {label: '999999999', input: 999999999, expected: '99999999900000000'}
    ])('parses $label to atomic bigint', ({input, expected}) => {
        expect(parseAtomicAmount(input as string, decimals)?.toString()).toBe(expected);
    });

    it.each([
        {label: 'MAX_SAFE_INTEGER', input: Number.MAX_SAFE_INTEGER, expected: '900719925474099100000000'},
        {label: 'MIN_SAFE_INTEGER', input: Number.MIN_SAFE_INTEGER, expected: '-900719925474099100000000'}
    ])('parses $label to atomic bigint', ({input, expected}) => {
        expect(parseAtomicAmount(input, decimals)?.toString()).toBe(expected);
    });

    it.each([
        {input: '1.000000001', expected: '100000000'},
        {input: '1.234567891234', expected: '123456789'},
        {input: '-1.234567891234', expected: '-123456789'},
        {input: '1.234567899999', expected: '123456789'},
        {input: '0.8001', expected: '80010000'},
        {input: '0.000000009', expected: '0'}
    ])('truncates extra decimals in "$input"', ({input, expected}) => {
        expect(parseAtomicAmount(input, decimals)?.toString()).toBe(expected);
    });

    it.each([
        {label: 'empty string', input: ''},
        {label: 'space', input: ' '},
        {label: 'bare minus', input: '-'},
        {label: '"1.2.3"', input: '1.2.3'},
        {label: '"1.2,3"', input: '1.2,3'},
        {label: '"1,2.3"', input: '1,2.3'},
        {label: '"1,2,3"', input: '1,2,3'},
        {label: '"1e10"', input: '1e10'},
        {label: '"abc"', input: 'abc'},
        {label: 'Number.MAX_VALUE', input: Number.MAX_VALUE},
        {label: 'Number.MIN_VALUE', input: Number.MIN_VALUE},
        {label: 'undefined', input: undefined},
        {label: 'null', input: null},
        {label: 'object', input: {}},
        {label: 'Symbol', input: Symbol()},
        {label: 'NaN', input: NaN},
        {label: 'Infinity', input: Infinity},
        {label: '-Infinity', input: -Infinity}
    ] as const)('returns undefined for invalid input: $label', ({input}) => {
        expect(parseAtomicAmount(input as any, decimals)).toBeUndefined();
    });
});

describe('formatAtomicAmount', () => {
    it.each([
        {label: '123000000n', input: 123000000n, expected: '1.23'},
        {label: '100000000n', input: 100000000n, expected: '1'},
        {label: '0n', input: 0n, expected: '0'},
        {label: '1n', input: 1n, expected: '0.00000001'},
        {label: '-50000000n', input: -50000000n, expected: '-0.5'}
    ])('formats $label to human-readable string', ({input, expected}) => {
        expect(formatAtomicAmount(input, decimals)).toBe(expected);
    });

    it('applies decimal trimming and padding options', () => {
        expect(formatAtomicAmount(123000000n, decimals, {minDecimalPlaces: 4})).toBe('1.2300');
        expect(formatAtomicAmount(123000000n, decimals, {maxDecimalPlaces: 1})).toBe('1.2');
        expect(formatAtomicAmount(100000000n, decimals, {minDecimalPlaces: 2})).toBe('1.00');
        expect(formatAtomicAmount(1n, decimals, {minDecimalPlaces: 10})).toBe('0.0000000100');
        expect(formatAtomicAmount(110000000n, decimals, {maxDecimalPlaces: 0})).toBe('1');
    });

    it('applies thousand separator option', () => {
        expect(formatAtomicAmount(1234567890000n, decimals, {thousandSeparator: ' '})).toBe('12 345.6789');
        expect(formatAtomicAmount(1000000000000n, decimals, {thousandSeparator: ','})).toBe('10,000');
        expect(formatAtomicAmount(100000000n, decimals, {thousandSeparator: ' ', minDecimalPlaces: 2})).toBe('1.00');
    });

    it('formats large bigint numbers', () => {
        expect(formatAtomicAmount(123456789123456789123456789n, decimals)).toBe('1234567891234567891.23456789');
    });

    it('handles zero and negative edge cases', () => {
        expect(formatAtomicAmount(0n, decimals, {minDecimalPlaces: 2})).toBe('0.00');
        expect(formatAtomicAmount(-1n, decimals)).toBe('-0.00000001');
    });

    it.each([
        {label: 'undefined', input: undefined},
        {label: 'null', input: null},
        {label: '"abc"', input: 'abc'},
        {label: '"1e4"', input: '1e4'},
        {label: 'object', input: {}},
        {label: 'Symbol', input: Symbol()},
        {label: 'NaN', input: NaN},
        {label: 'Infinity', input: Infinity},
        {label: '-Infinity', input: -Infinity}
    ] as const)('returns undefined for invalid input: $label', ({input}) => {
        expect(formatAtomicAmount(input as any, decimals)).toBeUndefined();
    });
});
