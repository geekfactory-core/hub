import {describe, expect, test} from 'vitest';
import {formatAtomicAmount, parseAtomicAmount} from './atomic';

const decimals = 8;

describe('parseAtomicAmount', () => {
    test('valid parsing', () => {
        expect(parseAtomicAmount('1', decimals)?.toString()).toBe('100000000');
        expect(parseAtomicAmount('1.23', decimals)?.toString()).toBe('123000000');
        expect(parseAtomicAmount('0.00000001', decimals)?.toString()).toBe('1');
        expect(parseAtomicAmount('1,23', decimals)?.toString()).toBe('123000000');
        expect(parseAtomicAmount('-0.5', decimals)?.toString()).toBe('-50000000');
        expect(parseAtomicAmount('0001.2300', decimals)?.toString()).toBe('123000000');
        expect(parseAtomicAmount('10 001.2300', decimals)?.toString()).toBe('1000123000000');
        expect(parseAtomicAmount(999999999, decimals)?.toString()).toBe('99999999900000000');
    });

    test('handles MAX_SAFE_INTEGER and MIN_SAFE_INTEGER', () => {
        expect(parseAtomicAmount(Number.MAX_SAFE_INTEGER, decimals)?.toString()).toBe('900719925474099100000000');
        expect(parseAtomicAmount(Number.MIN_SAFE_INTEGER, decimals)?.toString()).toBe('-900719925474099100000000');
    });

    test('truncates extra decimals', () => {
        expect(parseAtomicAmount('1.000000001', decimals)?.toString()).toBe('100000000');
        expect(parseAtomicAmount('1.234567891234', decimals)?.toString()).toBe('123456789');
        expect(parseAtomicAmount('-1.234567891234', decimals)?.toString()).toBe('-123456789');
        expect(parseAtomicAmount('1.234567899999', decimals)?.toString()).toBe('123456789');
        expect(parseAtomicAmount('0.8001', decimals)?.toString()).toBe('80010000');
        expect(parseAtomicAmount('0.000000009', decimals)?.toString()).toBe('0');
    });

    test.each([
        ['', ''],
        [' ', ' '],
        ['-', '-'],
        ['1.2.3', '1.2.3'],
        ['1.2,3', '1.2,3'],
        ['1,2.3', '1,2.3'],
        ['1,2,3', '1,2,3'],
        ['1e10', '1e10'],
        ['abc', 'abc'],
        [Number.MAX_VALUE, 'Number.MAX_VALUE'],
        [Number.MIN_VALUE, 'Number.MIN_VALUE'],
        [undefined, 'undefined'],
        [null, 'null'],
        [{}, 'object'],
        [Symbol(), 'Symbol'],
        [NaN, 'NaN'],
        [Infinity, 'Infinity'],
        [-Infinity, '-Infinity']
    ])('invalid parsing: %s → undefined', (input, _label) => {
        expect(parseAtomicAmount(input as any, decimals)).toBeUndefined();
    });
});

describe('formatAtomicAmount', () => {
    test('basic formatting', () => {
        expect(formatAtomicAmount(123000000n, decimals)).toBe('1.23');
        expect(formatAtomicAmount(100000000n, decimals)).toBe('1');
        expect(formatAtomicAmount(0n, decimals)).toBe('0');
        expect(formatAtomicAmount(1n, decimals)).toBe('0.00000001');
        expect(formatAtomicAmount(-50000000n, decimals)).toBe('-0.5');
    });

    test('decimal trimming and padding', () => {
        expect(formatAtomicAmount(123000000n, decimals, {minDecimalPlaces: 4})).toBe('1.2300');
        expect(formatAtomicAmount(123000000n, decimals, {maxDecimalPlaces: 1})).toBe('1.2');
        expect(formatAtomicAmount(100000000n, decimals, {minDecimalPlaces: 2})).toBe('1.00');
        expect(formatAtomicAmount(1n, decimals, {minDecimalPlaces: 10})).toBe('0.0000000100');
        expect(formatAtomicAmount(110000000n, decimals, {maxDecimalPlaces: 0})).toBe('1');
    });

    test('thousand separator', () => {
        expect(formatAtomicAmount(1234567890000n, decimals, {thousandSeparator: ' '})).toBe('12 345.6789');
        expect(formatAtomicAmount(1000000000000n, decimals, {thousandSeparator: ','})).toBe('10,000');
        expect(formatAtomicAmount(100000000n, decimals, {thousandSeparator: ' ', minDecimalPlaces: 2})).toBe('1.00');
    });

    test('large number formatting', () => {
        expect(formatAtomicAmount(123456789123456789123456789n, decimals)).toBe('1234567891234567891.23456789');
    });

    test('zero and negative edge cases', () => {
        expect(formatAtomicAmount(0n, decimals, {minDecimalPlaces: 2})).toBe('0.00');
        expect(formatAtomicAmount(-1n, decimals)).toBe('-0.00000001');
    });

    test.each([
        [undefined, 'undefined'],
        [null, 'null'],
        ['abc', 'abc'],
        ['1e4', '1e4'],
        [{}, 'object'],
        [Symbol(), 'Symbol'],
        [NaN, 'NaN'],
        [Infinity, 'Infinity'],
        [-Infinity, '-Infinity']
    ])('invalid input: %s → undefined', (input, _label) => {
        expect(formatAtomicAmount(input as any, decimals)).toBeUndefined();
    });
});
