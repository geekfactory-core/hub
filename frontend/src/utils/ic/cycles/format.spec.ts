import {describe, expect, it} from 'vitest';
import type {ValueWithUnit} from '../../core/number/types';
import {formatCyclesValueWithUnit, formatCyclesValueWithUnitByStrategy, formatIcpXdrConversionRateInTCyclesPerICP} from './format';

describe('cycles format utils', () => {
    describe('formatCyclesValueWithUnit', () => {
        it('should format cycles with 12 decimal places by default', () => {
            const valueWithUnit: ValueWithUnit = {value: 1.23456789012345, unit: 'T'};
            expect(formatCyclesValueWithUnit(valueWithUnit)).toBe('1.234567890123T');
        });

        it('should format cycles without unit space', () => {
            const valueWithUnit: ValueWithUnit = {value: 100, unit: 'T'};
            expect(formatCyclesValueWithUnit(valueWithUnit)).toBe('100T');
        });

        it('should handle undefined value', () => {
            expect(formatCyclesValueWithUnit(undefined)).toBe('-');
        });

        it('should respect custom decimalPlaces option', () => {
            const valueWithUnit: ValueWithUnit = {value: 1.23456789, unit: 'T'};
            expect(formatCyclesValueWithUnit(valueWithUnit, {decimalPlaces: 4})).toBe('1.2346T');
        });

        it('should respect custom fallback option', () => {
            expect(formatCyclesValueWithUnit(undefined, {fallback: 'N/A'})).toBe('N/A');
        });

        it('should format large values correctly', () => {
            const valueWithUnit: ValueWithUnit = {value: 123456.789, unit: 'T'};
            expect(formatCyclesValueWithUnit(valueWithUnit)).toBe('123 456.789T');
        });

        it('should format small values with many decimal places', () => {
            const valueWithUnit: ValueWithUnit = {value: 0.000001, unit: 'T'};
            expect(formatCyclesValueWithUnit(valueWithUnit)).toBe('0.000001T');
        });

        it('should handle bigint values', () => {
            const valueWithUnit: ValueWithUnit = {value: 1234n, unit: 'T'};
            expect(formatCyclesValueWithUnit(valueWithUnit)).toBe('1 234T');
        });

        it('should trim trailing zeros', () => {
            const valueWithUnit: ValueWithUnit = {value: 1.5, unit: 'T'};
            expect(formatCyclesValueWithUnit(valueWithUnit)).toBe('1.5T');
        });

        it('should handle zero value', () => {
            const valueWithUnit: ValueWithUnit = {value: 0, unit: 'T'};
            expect(formatCyclesValueWithUnit(valueWithUnit)).toBe('0T');
        });

        it('should handle negative values', () => {
            const valueWithUnit: ValueWithUnit = {value: -123.456, unit: 'T'};
            expect(formatCyclesValueWithUnit(valueWithUnit)).toBe('-123.456T');
        });

        it('should work with different units', () => {
            const valueWithUnit1: ValueWithUnit = {value: 100, unit: 'G'};
            expect(formatCyclesValueWithUnit(valueWithUnit1)).toBe('100G');

            const valueWithUnit2: ValueWithUnit = {value: 50, unit: 'M'};
            expect(formatCyclesValueWithUnit(valueWithUnit2)).toBe('50M');
        });

        it('should handle empty unit', () => {
            const valueWithUnit: ValueWithUnit = {value: 100, unit: ''};
            expect(formatCyclesValueWithUnit(valueWithUnit)).toBe('100');
        });
    });

    describe('formatCyclesValueWithUnitByStrategy', () => {
        describe('short strategy', () => {
            it('should use 2 decimal places for values above 0.01T', () => {
                const valueWithUnit: ValueWithUnit = {value: 0.011, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'short')).toBe('0.01T');
            });

            it('should use 2 decimal places for values equal to 0.01T', () => {
                const valueWithUnit: ValueWithUnit = {value: 0.01, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'short')).toBe('0.01T');
            });

            it('should use 4 decimal places for values below 0.01T', () => {
                const valueWithUnit: ValueWithUnit = {value: 0.009999, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'short')).toBe('0.01T');
            });

            it('should use 4 decimal places for values near zero', () => {
                const valueWithUnit: ValueWithUnit = {value: 0.00123456, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'short')).toBe('0.0012T');
            });

            it('should use 2 decimal places for large values', () => {
                const valueWithUnit: ValueWithUnit = {value: 123.456789, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'short')).toBe('123.46T');
            });

            it('should handle exactly 0.01T threshold', () => {
                const valueWithUnit1: ValueWithUnit = {value: 0.0100001, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit1, 'short')).toBe('0.01T');

                const valueWithUnit2: ValueWithUnit = {value: 0.0099999, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit2, 'short')).toBe('0.01T');
            });
        });

        describe('long strategy', () => {
            it('should use 4 decimal places for values above 0.01T', () => {
                const valueWithUnit: ValueWithUnit = {value: 0.011, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'long')).toBe('0.011T');
            });

            it('should use 4 decimal places for values equal to 0.01T', () => {
                const valueWithUnit: ValueWithUnit = {value: 0.01, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'long')).toBe('0.01T');
            });

            it('should use 12 decimal places for values below 0.01T', () => {
                const valueWithUnit: ValueWithUnit = {value: 0.009999, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'long')).toBe('0.009999T');
            });

            it('should use 12 decimal places for very small values', () => {
                const valueWithUnit: ValueWithUnit = {value: 0.000001234567, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'long')).toBe('0.000001234567T');
            });

            it('should use 4 decimal places for large values', () => {
                const valueWithUnit: ValueWithUnit = {value: 123.456789, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'long')).toBe('123.4568T');
            });

            it('should handle exactly 0.01T threshold', () => {
                const valueWithUnit1: ValueWithUnit = {value: 0.0100001, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit1, 'long')).toBe('0.01T');

                const valueWithUnit2: ValueWithUnit = {value: 0.0099999, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit2, 'long')).toBe('0.0099999T');
            });
        });

        describe('edge cases', () => {
            it('should handle undefined value with short strategy', () => {
                expect(formatCyclesValueWithUnitByStrategy(undefined, 'short')).toBe('-');
            });

            it('should handle undefined value with long strategy', () => {
                expect(formatCyclesValueWithUnitByStrategy(undefined, 'long')).toBe('-');
            });

            it('should handle zero value with short strategy', () => {
                const valueWithUnit: ValueWithUnit = {value: 0, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'short')).toBe('0T');
            });

            it('should handle zero value with long strategy', () => {
                const valueWithUnit: ValueWithUnit = {value: 0, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'long')).toBe('0T');
            });

            it('should handle negative values with short strategy', () => {
                const valueWithUnit: ValueWithUnit = {value: -1.23456, unit: 'T'};
                // Note: Negative values are not > 0.01, so uses default (4 decimal places)
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'short')).toBe('-1.2346T');
            });

            it('should handle negative values with long strategy', () => {
                const valueWithUnit: ValueWithUnit = {value: -1.23456, unit: 'T'};
                // Note: Negative values are not > 0.01, so uses default (12 decimal places)
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'long')).toBe('-1.23456T');
            });

            it('should handle bigint values with short strategy', () => {
                const valueWithUnit: ValueWithUnit = {value: 100n, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'short')).toBe('100T');
            });

            it('should handle bigint values with long strategy', () => {
                const valueWithUnit: ValueWithUnit = {value: 100n, unit: 'T'};
                expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'long')).toBe('100T');
            });
        });

        describe('threshold boundary testing', () => {
            it('should apply correct decimal places at boundary for short strategy', () => {
                const testCases = [
                    {value: 0.01000001, expected: '0.01T'},
                    {value: 0.01, expected: '0.01T'},
                    {value: 0.00999999, expected: '0.01T'},
                    {value: 0.001, expected: '0.001T'},
                    {value: 0.0001, expected: '0.0001T'}
                ];

                testCases.forEach(({value, expected}) => {
                    const valueWithUnit: ValueWithUnit = {value, unit: 'T'};
                    expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'short')).toBe(expected);
                });
            });

            it('should apply correct decimal places at boundary for long strategy', () => {
                const testCases = [
                    {value: 0.01000001, expected: '0.01T'},
                    {value: 0.01, expected: '0.01T'},
                    {value: 0.00999999, expected: '0.00999999T'},
                    {value: 0.001, expected: '0.001T'},
                    {value: 0.0001, expected: '0.0001T'},
                    {value: 0.000001, expected: '0.000001T'}
                ];

                testCases.forEach(({value, expected}) => {
                    const valueWithUnit: ValueWithUnit = {value, unit: 'T'};
                    expect(formatCyclesValueWithUnitByStrategy(valueWithUnit, 'long')).toBe(expected);
                });
            });
        });
    });

    describe('formatIcpXdrConversionRateInTCyclesPerICP', () => {
        it('should format conversion rate with 4 decimal places', () => {
            // xdrPermyriadPerIcp = 10_000 means 1 T cycles per ICP
            expect(formatIcpXdrConversionRateInTCyclesPerICP(10_000n)).toBe('1 ICP');
        });

        it('should format conversion rate when 1 ICP = 2 T cycles', () => {
            expect(formatIcpXdrConversionRateInTCyclesPerICP(20_000n)).toBe('0.5 ICP');
        });

        it('should format conversion rate when 1 ICP = 0.5 T cycles', () => {
            expect(formatIcpXdrConversionRateInTCyclesPerICP(5_000n)).toBe('2 ICP');
        });

        it('should format small conversion rates', () => {
            expect(formatIcpXdrConversionRateInTCyclesPerICP(1_000n)).toBe('10 ICP');
        });

        it('should format large conversion rates', () => {
            expect(formatIcpXdrConversionRateInTCyclesPerICP(100_000n)).toBe('0.1 ICP');
        });

        it('should round to 4 decimal places', () => {
            expect(formatIcpXdrConversionRateInTCyclesPerICP(33_333n)).toBe('0.3 ICP');
        });

        it('should handle very small values with precision', () => {
            expect(formatIcpXdrConversionRateInTCyclesPerICP(12_345n)).toBe('0.81 ICP');
        });

        it('should format with thousand separator for large values', () => {
            expect(formatIcpXdrConversionRateInTCyclesPerICP(1n)).toBe('10 000 ICP');
        });

        it('should handle typical market rates', () => {
            expect(formatIcpXdrConversionRateInTCyclesPerICP(13_500n)).toBe('0.7407 ICP');
        });
    });
});
