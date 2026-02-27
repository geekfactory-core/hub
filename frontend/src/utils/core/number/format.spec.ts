import {describe, expect, it} from 'vitest';
import {formatNumber, formatNumberParts, formatNumberWithUnit} from './format';

describe('format utils', () => {
    describe('formatNumberParts', () => {
        it('formats positive integer', () => {
            expect(formatNumberParts('1234', '', false)).toBe('1234');
            expect(formatNumberParts('0', '', false)).toBe('0');
            expect(formatNumberParts('999', '', false)).toBe('999');
        });

        it('formats negative integer', () => {
            expect(formatNumberParts('1234', '', true)).toBe('-1234');
            expect(formatNumberParts('0', '', true)).toBe('-0');
        });

        it('formats positive number with fractional part', () => {
            expect(formatNumberParts('1234', '567', false)).toBe('1234.567');
            expect(formatNumberParts('0', '123', false)).toBe('0.123');
            expect(formatNumberParts('999', '99', false)).toBe('999.99');
        });

        it('formats negative number with fractional part', () => {
            expect(formatNumberParts('1234', '567', true)).toBe('-1234.567');
            expect(formatNumberParts('0', '001', true)).toBe('-0.001');
        });

        it('applies thousand separator', () => {
            expect(formatNumberParts('1234', '', false, {thousandSeparator: ' '})).toBe('1 234');
            expect(formatNumberParts('1234567', '', false, {thousandSeparator: ' '})).toBe('1 234 567');
            expect(formatNumberParts('1234567', '89', false, {thousandSeparator: ' '})).toBe('1 234 567.89');
            expect(formatNumberParts('1000000', '001', true, {thousandSeparator: ','})).toBe('-1,000,000.001');
        });

        it.each([
            {fracPart: '456789', maxDecimalPlaces: 2, expected: '123.45'},
            {fracPart: '456789', maxDecimalPlaces: 4, expected: '123.4567'},
            {fracPart: '456', maxDecimalPlaces: 5, expected: '123.456'},
            {fracPart: '456000', maxDecimalPlaces: 3, expected: '123.456'}
        ])('truncates fractional part to $maxDecimalPlaces decimal places', ({fracPart, maxDecimalPlaces, expected}) => {
            expect(formatNumberParts('123', fracPart, false, {maxDecimalPlaces})).toBe(expected);
        });

        it.each([
            {fracPart: '4', minDecimalPlaces: 3, expected: '123.400'},
            {fracPart: '', minDecimalPlaces: 2, expected: '123.00'},
            {fracPart: '456', minDecimalPlaces: 5, expected: '123.45600'}
        ])('pads fractional part to $minDecimalPlaces decimal places', ({fracPart, minDecimalPlaces, expected}) => {
            expect(formatNumberParts('123', fracPart, false, {minDecimalPlaces})).toBe(expected);
        });

        it('trims trailing zeros from fractional part by default', () => {
            expect(formatNumberParts('123', '4000', false)).toBe('123.4');
            expect(formatNumberParts('123', '45000', false)).toBe('123.45');
            expect(formatNumberParts('0', '100', false)).toBe('0.1');
        });

        it('handles combination of options', () => {
            expect(
                formatNumberParts('1234567', '890000', false, {
                    thousandSeparator: ' ',
                    maxDecimalPlaces: 2,
                    minDecimalPlaces: 2
                })
            ).toBe('1 234 567.89');

            expect(
                formatNumberParts('1000', '5', true, {
                    thousandSeparator: ',',
                    minDecimalPlaces: 3
                })
            ).toBe('-1,000.500');

            expect(
                formatNumberParts('999999', '123456', false, {
                    thousandSeparator: ' ',
                    maxDecimalPlaces: 3,
                    minDecimalPlaces: 2
                })
            ).toBe('999 999.123');
        });

        it('handles empty integer part', () => {
            expect(formatNumberParts('', '123', false)).toBe('.123');
            expect(formatNumberParts('', '', false)).toBe('');
        });

        it('handles fractional part of only zeros', () => {
            expect(formatNumberParts('123', '000', false)).toBe('123');
            expect(formatNumberParts('123', '000', false, {minDecimalPlaces: 2})).toBe('123.00');
        });
    });

    describe('formatNumber', () => {
        it('formats regular numbers with default 2 decimal places', () => {
            expect(formatNumber(1234.567)).toBe('1 234.57');
            expect(formatNumber(1000)).toBe('1 000');
            expect(formatNumber(0)).toBe('0');
        });

        it.each([
            {decimalPlaces: 0, expected: '1 235'},
            {decimalPlaces: 1, expected: '1 234.6'},
            {decimalPlaces: 2, expected: '1 234.57'},
            {decimalPlaces: 3, expected: '1 234.567'},
            {decimalPlaces: 4, expected: '1 234.567'}
        ])('formats 1234.567 with $decimalPlaces decimal places as "$expected"', ({decimalPlaces, expected}) => {
            expect(formatNumber(1234.567, decimalPlaces)).toBe(expected);
        });

        it('formats bigint values', () => {
            expect(formatNumber(1234567n)).toBe('1 234 567');
            expect(formatNumber(0n)).toBe('0');
        });

        it('formats negative numbers', () => {
            expect(formatNumber(-1234.567)).toBe('-1 234.57');
            expect(formatNumber(-1234n)).toBe('-1 234');
            expect(formatNumber(-1000, 0)).toBe('-1 000');
        });

        it('formats very large numbers', () => {
            expect(formatNumber(1234567890.123)).toBe('1 234 567 890.12');
            expect(formatNumber(999999999999.99)).toBe('999 999 999 999.99');
            expect(formatNumber(Number.MAX_SAFE_INTEGER)).toBe('9 007 199 254 740 991');
            expect(formatNumber(Number.MIN_SAFE_INTEGER)).toBe('-9 007 199 254 740 991');
            expect(formatNumber(1e10)).toBe('10 000 000 000');
        });

        it('formats very small numbers', () => {
            expect(formatNumber(0.001)).toBe('0');
            expect(formatNumber(0.001, 3)).toBe('0.001');
            expect(formatNumber(0.0001, 4)).toBe('0.0001');
        });

        it.each([
            {input: 1.235, decimalPlaces: 2, expected: '1.24'},
            {input: 1.234, decimalPlaces: 2, expected: '1.23'},
            {input: 1.999, decimalPlaces: 2, expected: '2'},
            {input: 999.999, decimalPlaces: 2, expected: '1 000'}
        ])('rounds $input to $decimalPlaces places → "$expected" (ROUND_HALF_UP)', ({input, decimalPlaces, expected}) => {
            expect(formatNumber(input, decimalPlaces)).toBe(expected);
        });

        it.each([
            {label: 'NaN', value: NaN},
            {label: 'Infinity', value: Infinity},
            {label: '-Infinity', value: -Infinity},
            {label: 'null', value: null},
            {label: '1e20 (exceeds safe range)', value: 1e20}
        ] as const)('returns undefined for $label', ({value}) => {
            expect(formatNumber(value)).toBeUndefined();
        });
    });

    describe('formatNumberWithUnit', () => {
        it('returns fallback when value is undefined', () => {
            expect(formatNumberWithUnit(undefined, 'ICP')).toBe('-');
        });

        it('returns fallback when value is null', () => {
            expect(formatNumberWithUnit(null as unknown as undefined, 'ICP')).toBe('-');
        });

        it('returns fallback when value cannot be formatted (Infinity)', () => {
            expect(formatNumberWithUnit(Infinity, 'ICP')).toBe('-');
        });

        it('formats number with two decimals by default', () => {
            expect(formatNumberWithUnit(1234.567, 'ICP')).toBe('1 234.57ICP');
        });

        it('respects unitSpace option', () => {
            expect(formatNumberWithUnit(1000, 'ICP', {unitSpace: ' '})).toBe('1 000 ICP');
        });

        it('works with bigint', () => {
            expect(formatNumberWithUnit(1234n, 'ICP')).toBe('1 234ICP');
            expect(formatNumberWithUnit(1234567890123456789n, 'ICP')).toBe('-');
        });

        it('respects decimalPlaces option', () => {
            expect(formatNumberWithUnit(12.3456, 'ICP', {decimalPlaces: 4})).toBe('12.3456ICP');
        });

        it('handles empty unit', () => {
            expect(formatNumberWithUnit(42)).toBe('42');
        });

        it('uses custom fallback', () => {
            expect(formatNumberWithUnit(undefined, 'ICP', {fallback: 'N/A'})).toBe('N/A');
        });
    });
});
