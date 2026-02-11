import {describe, expect, test} from 'vitest';
import {addThousandSeparator, applyDecimalPrecision, formatDecimalString, normalizeInput, roundDecimalString} from './decimal';

describe('roundDecimalString', () => {
    test('basic rounding', () => {
        expect(roundDecimalString('1.23456789', 4)).toBe('1.2346');
        expect(roundDecimalString('1.23456789', 12)).toBe('1.23456789');
        expect(roundDecimalString('0.9999999', 4)).toBe('1');
        expect(roundDecimalString(' 0.9999999 ', 12)).toBe('0.9999999');
        expect(roundDecimalString('-12.3456', 2)).toBe('-12.35');
        expect(roundDecimalString('1 000.12', 1)).toBe('1000.1');
        expect(roundDecimalString(Number.MAX_SAFE_INTEGER.toString(), 1)).toBe('9007199254740991');
        expect(roundDecimalString(Number.MIN_SAFE_INTEGER.toString(), 1)).toBe('-9007199254740991');
    });

    test('edge rounding', () => {
        expect(roundDecimalString('1.9999', 0)).toBe('2');
        expect(roundDecimalString('999.999', 0)).toBe('1000');
        expect(roundDecimalString('-0.999999', 0)).toBe('-1');
        expect(roundDecimalString('0.00000051', 6)).toBe('0.000001');
        expect(roundDecimalString('0.00000049', 6)).toBe('0');
    });

    test('strip zero fraction after rounding', () => {
        expect(roundDecimalString('1.90000000', 8)).toBe('1.9');
        expect(roundDecimalString('1.00000000', 8)).toBe('1');
    });

    test.each([
        ['abc', 'abc'],
        ['', ''],
        ['-', '-'],
        ['1e4', '1e4'],
        [Number.MAX_VALUE, 'Number.MAX_VALUE'],
        [Number.MIN_VALUE, 'Number.MIN_VALUE'],
        [undefined, 'undefined'],
        [null, 'null'],
        [Symbol(), 'Symbol']
    ])('invalid input: %s → undefined', (input, _label) => {
        expect(roundDecimalString(input as any, 2)).toBeUndefined();
    });
});

describe('formatDecimalString', () => {
    test('trim & pad fractional parts', () => {
        expect(formatDecimalString('1234567.89000')).toBe('1234567.89');
        expect(formatDecimalString('0.000123000')).toBe('0.000123');
        expect(formatDecimalString('1.2', {minDecimalPlaces: 4})).toBe('1.2000');
        expect(formatDecimalString('1.234567', {maxDecimalPlaces: 2})).toBe('1.23');
        expect(formatDecimalString(Number.MAX_SAFE_INTEGER.toString())).toBe('9007199254740991');
        expect(formatDecimalString(Number.MIN_SAFE_INTEGER.toString())).toBe('-9007199254740991');
    });

    test('thousand separator', () => {
        expect(formatDecimalString('1234567.89', {thousandSeparator: ' '})).toBe('1 234 567.89');
        expect(formatDecimalString('1000000', {thousandSeparator: ','})).toBe('1,000,000');
    });

    test('min + max combo', () => {
        expect(formatDecimalString('0.5', {minDecimalPlaces: 3, maxDecimalPlaces: 4})).toBe('0.500');
        expect(formatDecimalString('0.56789', {maxDecimalPlaces: 2, minDecimalPlaces: 4})).toBe('0.5600');
    });

    test('format integers with minDecimalPlaces', () => {
        expect(formatDecimalString('1000', {minDecimalPlaces: 3})).toBe('1000.000');
    });

    test.each([
        ['', ''],
        ['foo', 'foo'],
        ['-', '-'],
        [{}, 'object'],
        [Number.MAX_VALUE, 'Number.MAX_VALUE'],
        [Number.MIN_VALUE, 'Number.MIN_VALUE'],
        [undefined, 'undefined'],
        [null, 'null'],
        [Symbol(), 'Symbol']
    ])('invalid input: %s → undefined', (input, _label) => {
        expect(formatDecimalString(input as any)).toBeUndefined();
    });
});

describe('applyDecimalPrecision', () => {
    test('trims trailing zeros', () => {
        expect(applyDecimalPrecision('120000', {})).toBe('12');
        expect(applyDecimalPrecision('100', {})).toBe('1');
        expect(applyDecimalPrecision('0', {})).toBe('');
    });

    test('pads with zeros to minDecimalPlaces', () => {
        expect(applyDecimalPrecision('12', {minDecimalPlaces: 4})).toBe('1200');
        expect(applyDecimalPrecision('', {minDecimalPlaces: 3})).toBe('000');
    });

    test('combination of min/max', () => {
        expect(applyDecimalPrecision('123456', {minDecimalPlaces: 4, maxDecimalPlaces: 4})).toBe('1234');
        expect(applyDecimalPrecision('1', {minDecimalPlaces: 4, maxDecimalPlaces: 4})).toBe('1000');
        expect(applyDecimalPrecision('123456', {minDecimalPlaces: 6, maxDecimalPlaces: 6})).toBe('123456');
    });

    test('maxDecimalPlaces cuts extra digits', () => {
        expect(applyDecimalPrecision('123456', {maxDecimalPlaces: 3})).toBe('123');
        expect(applyDecimalPrecision('123456', {maxDecimalPlaces: 0})).toBe('');
    });

    test('returns original if within bounds', () => {
        expect(applyDecimalPrecision('1234', {minDecimalPlaces: 3, maxDecimalPlaces: 6})).toBe('1234');
    });
});

describe('normalizeInput', () => {
    test('valid values', () => {
        expect(normalizeInput('123.456')).toEqual({isNegative: false, intPart: '123', fracPart: '456'});
        expect(normalizeInput('-0.5')).toEqual({isNegative: true, intPart: '0', fracPart: '5'});
        expect(normalizeInput('1.')).toEqual({isNegative: false, intPart: '1', fracPart: ''});
        expect(normalizeInput('.5')).toEqual({isNegative: false, intPart: '0', fracPart: '5'});
        expect(normalizeInput(1.12)).toEqual({isNegative: false, intPart: '1', fracPart: '12'});
        expect(normalizeInput(1e10)).toEqual({isNegative: false, intPart: '10000000000', fracPart: ''});
        expect(normalizeInput(Number.MAX_SAFE_INTEGER)).toEqual({isNegative: false, intPart: '9007199254740991', fracPart: ''});
        expect(normalizeInput(Number.MIN_SAFE_INTEGER)).toEqual({isNegative: true, intPart: '9007199254740991', fracPart: ''});
        expect(normalizeInput(1n)).toEqual({isNegative: false, intPart: '1', fracPart: ''});
        expect(normalizeInput(BigInt(1e10))).toEqual({isNegative: false, intPart: '10000000000', fracPart: ''});
    });

    test('with separators', () => {
        expect(normalizeInput("1'000.45")).toEqual({isNegative: false, intPart: '1000', fracPart: '45'});
        expect(normalizeInput('1 000,45')).toEqual({isNegative: false, intPart: '1000', fracPart: '45'});
    });

    test.each([
        ['', ''],
        ['foo', 'foo'],
        ['-', '-'],
        ['NaN', 'NaN'],
        ['1e4', '1e4'],
        [Number.MAX_VALUE, 'Number.MAX_VALUE'],
        [Number.MIN_VALUE, 'Number.MIN_VALUE'],
        [1e20, '1e20'],
        [BigInt(1e20), 'BigInt'],
        [undefined, 'undefined'],
        [null, 'null'],
        [Symbol(), 'Symbol'],
        [Number.POSITIVE_INFINITY, 'Infinity']
    ])('invalid input: %s → undefined', (input, _label) => {
        expect(normalizeInput(input as any)).toBeUndefined();
    });
});

describe('addThousandSeparator', () => {
    test('adds separator correctly', () => {
        expect(addThousandSeparator('1000', ' ')).toBe('1 000');
        expect(addThousandSeparator('1234567', ',')).toBe('1,234,567');
        expect(addThousandSeparator('1234567890', '_')).toBe('1_234_567_890');
        expect(addThousandSeparator(Number.MAX_SAFE_INTEGER.toString(), '_')).toBe('9_007_199_254_740_991');
    });

    test('short numbers unchanged', () => {
        expect(addThousandSeparator('12', ',')).toBe('12');
        expect(addThousandSeparator('123', ',')).toBe('123');
    });
});
