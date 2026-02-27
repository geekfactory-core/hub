import {describe, expect, it} from 'vitest';
import {sumOfBigintsIfAllDefined} from './calculation';

describe('calculation utilities', () => {
    describe('sumOfBigintsIfAllDefined', () => {
        it('returns undefined when called with no arguments', () => {
            expect(sumOfBigintsIfAllDefined()).toBeUndefined();
        });

        it('returns the sum when all values are defined', () => {
            expect(sumOfBigintsIfAllDefined(1n, 2n, 3n)).toBe(6n);
            expect(sumOfBigintsIfAllDefined(0n)).toBe(0n);
            expect(sumOfBigintsIfAllDefined(10n, 20n)).toBe(30n);
        });

        it.each([
            {label: 'middle value undefined', args: [1n, undefined, 3n]},
            {label: 'single undefined', args: [undefined]},
            {label: 'trailing undefined', args: [1n, 2n, undefined]},
            {label: 'all undefined', args: [undefined, undefined]}
        ] as const)('returns undefined when $label', ({args}) => {
            expect(sumOfBigintsIfAllDefined(...args)).toBeUndefined();
        });

        it('returns correct sum for negative values', () => {
            expect(sumOfBigintsIfAllDefined(-1n, -2n, -3n)).toBe(-6n);
            expect(sumOfBigintsIfAllDefined(5n, -3n)).toBe(2n);
            expect(sumOfBigintsIfAllDefined(-10n, 10n)).toBe(0n);
        });

        it('handles large bigint values', () => {
            const large1 = 123456789012345678901234567890n;
            const large2 = 987654321098765432109876543210n;
            expect(sumOfBigintsIfAllDefined(large1, large2)).toBe(large1 + large2);
        });
    });
});
