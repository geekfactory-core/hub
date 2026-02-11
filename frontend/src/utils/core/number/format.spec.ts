import {describe, expect, it} from 'vitest';
import {formatNumber, formatNumberParts, formatNumberWithUnit} from './format';

describe('format utils', () => {
    describe('formatNumberParts', () => {
        it('should format positive numbers without fractional part', () => {
            expect(formatNumberParts('1234', '', false)).toBe('1234');
            expect(formatNumberParts('0', '', false)).toBe('0');
            expect(formatNumberParts('999', '', false)).toBe('999');
        });

        it('should format negative numbers without fractional part', () => {
            expect(formatNumberParts('1234', '', true)).toBe('-1234');
            expect(formatNumberParts('0', '', true)).toBe('-0');
        });

        it('should format positive numbers with fractional part', () => {
            expect(formatNumberParts('1234', '567', false)).toBe('1234.567');
            expect(formatNumberParts('0', '123', false)).toBe('0.123');
            expect(formatNumberParts('999', '99', false)).toBe('999.99');
        });

        it('should format negative numbers with fractional part', () => {
            expect(formatNumberParts('1234', '567', true)).toBe('-1234.567');
            expect(formatNumberParts('0', '001', true)).toBe('-0.001');
        });

        it('should apply thousand separator when specified', () => {
            expect(formatNumberParts('1234', '', false, {thousandSeparator: ' '})).toBe('1 234');
            expect(formatNumberParts('1234567', '', false, {thousandSeparator: ' '})).toBe('1 234 567');
            expect(formatNumberParts('1234567', '89', false, {thousandSeparator: ' '})).toBe('1 234 567.89');
            expect(formatNumberParts('1000000', '001', true, {thousandSeparator: ','})).toBe('-1,000,000.001');
        });

        it('should apply maxDecimalPlaces option', () => {
            expect(formatNumberParts('123', '456789', false, {maxDecimalPlaces: 2})).toBe('123.45');
            expect(formatNumberParts('123', '456789', false, {maxDecimalPlaces: 4})).toBe('123.4567');
            expect(formatNumberParts('123', '456', false, {maxDecimalPlaces: 5})).toBe('123.456');
            expect(formatNumberParts('123', '456000', false, {maxDecimalPlaces: 3})).toBe('123.456');
        });

        it('should apply minDecimalPlaces option', () => {
            expect(formatNumberParts('123', '4', false, {minDecimalPlaces: 3})).toBe('123.400');
            expect(formatNumberParts('123', '', false, {minDecimalPlaces: 2})).toBe('123.00');
            expect(formatNumberParts('123', '456', false, {minDecimalPlaces: 5})).toBe('123.45600');
        });

        it('should trim trailing zeros from fractional part by default', () => {
            expect(formatNumberParts('123', '4000', false)).toBe('123.4');
            expect(formatNumberParts('123', '45000', false)).toBe('123.45');
            expect(formatNumberParts('0', '100', false)).toBe('0.1');
        });

        it('should handle combination of options', () => {
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

        it('should handle empty integer part', () => {
            expect(formatNumberParts('', '123', false)).toBe('.123');
            expect(formatNumberParts('', '', false)).toBe('');
        });

        it('should handle only fractional zeros', () => {
            expect(formatNumberParts('123', '000', false)).toBe('123');
            expect(formatNumberParts('123', '000', false, {minDecimalPlaces: 2})).toBe('123.00');
        });
    });

    describe('formatNumber', () => {
        it('should format regular numbers with default 2 decimal places', () => {
            expect(formatNumber(1234.567)).toBe('1 234.57');
            expect(formatNumber(1234n)).toBe('1 234');
            expect(formatNumber(1000)).toBe('1 000');
            expect(formatNumber(0)).toBe('0');
        });

        it('should format numbers with custom decimal places', () => {
            expect(formatNumber(1234.567, 0)).toBe('1 235');
            expect(formatNumber(1234.567, 1)).toBe('1 234.6');
            expect(formatNumber(1234.567)).toBe('1 234.57');
            expect(formatNumber(1234.567, 2)).toBe('1 234.57');
            expect(formatNumber(1234.567, 3)).toBe('1 234.567');
            expect(formatNumber(1234.567, 4)).toBe('1 234.567');
            expect(formatNumber(1234.56789, 4)).toBe('1 234.5679');
        });

        it('should format bigint values', () => {
            expect(formatNumber(1234567n)).toBe('1 234 567');
            expect(formatNumber(0n)).toBe('0');
        });

        it('should handle negative numbers', () => {
            expect(formatNumber(-1234.567)).toBe('-1 234.57');
            expect(formatNumber(-1234n)).toBe('-1 234');
            expect(formatNumber(-1000, 0)).toBe('-1 000');
        });

        it('should handle very large numbers', () => {
            expect(formatNumber(1234567890.123)).toBe('1 234 567 890.12');
            expect(formatNumber(999999999999.99)).toBe('999 999 999 999.99');
            expect(formatNumber(Number.MAX_SAFE_INTEGER)).toBe('9 007 199 254 740 991');
            expect(formatNumber(Number.MIN_SAFE_INTEGER)).toBe('-9 007 199 254 740 991');
            expect(formatNumber(1e10)).toBe('10 000 000 000');
            expect(formatNumber(1e20)).toBeUndefined();
        });

        it('should handle very small numbers', () => {
            expect(formatNumber(0.001)).toBe('0');
            expect(formatNumber(0.001, 3)).toBe('0.001');
            expect(formatNumber(0.0001, 4)).toBe('0.0001');
        });

        it('should round numbers correctly (ROUND_HALF_UP)', () => {
            expect(formatNumber(1.235, 2)).toBe('1.24');
            expect(formatNumber(1.234, 2)).toBe('1.23');
            expect(formatNumber(1.999, 2)).toBe('2');
        });

        it('should return undefined for invalid inputs', () => {
            expect(formatNumber(NaN)).toBeUndefined();
            expect(formatNumber(Infinity)).toBeUndefined();
            expect(formatNumber(-Infinity)).toBeUndefined();
        });
    });

    describe('formatNumberWithUnit', () => {
        it('returns fallback when value is undefined', () => {
            expect(formatNumberWithUnit(undefined, 'ICP')).toBe('-');
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
