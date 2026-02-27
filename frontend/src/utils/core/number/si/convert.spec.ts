import {describe, expect, it} from 'vitest';
import {convertFractionalAdaptiveSI} from './convert';

describe('convertFractionalAdaptiveSI', () => {
    it('returns undefined for undefined input', () => {
        expect(convertFractionalAdaptiveSI(undefined)).toBeUndefined();
    });

    it.each([{input: -1n}, {input: -1000n}])('returns undefined for negative input $input', ({input}) => {
        expect(convertFractionalAdaptiveSI(input)).toBeUndefined();
    });

    it('returns {value: 0, unit: ""} for zero', () => {
        expect(convertFractionalAdaptiveSI(0n)).toEqual({value: 0, unit: ''});
    });

    it.each([
        {label: '1', input: 1n, expected: {value: 1, unit: ''}},
        {label: '999', input: 999n, expected: {value: 999, unit: ''}},
        {label: '1 000 → K', input: 1000n, expected: {value: 1, unit: 'K'}},
        {label: '1 500 → K', input: 1500n, expected: {value: 1.5, unit: 'K'}},
        {label: '999 000 → K', input: 999000n, expected: {value: 999, unit: 'K'}},
        {label: '1 000 000 → M', input: 1000000n, expected: {value: 1, unit: 'M'}},
        {label: '2 500 000 → M', input: 2500000n, expected: {value: 2.5, unit: 'M'}},
        {label: '999 000 000 → M', input: 999000000n, expected: {value: 999, unit: 'M'}},
        {label: '1 000 000 000 → G', input: 1000000000n, expected: {value: 1, unit: 'G'}},
        {label: '3 750 000 000 → G', input: 3750000000n, expected: {value: 3.75, unit: 'G'}},
        {label: '999 000 000 000 → G', input: 999000000000n, expected: {value: 999, unit: 'G'}},
        {label: '1T', input: 1000000000000n, expected: {value: 1, unit: 'T'}},
        {label: '5.25T', input: 5250000000000n, expected: {value: 5.25, unit: 'T'}},
        {label: '1000T (cap)', input: 1000000000000000n, expected: {value: 1000, unit: 'T'}},
        {label: '5000T (cap)', input: 5000000000000000n, expected: {value: 5000, unit: 'T'}}
    ])('auto-scales $label to SI unit', ({input, expected}) => {
        expect(convertFractionalAdaptiveSI(input)).toEqual(expected);
    });

    describe('with forceUnit parameter', () => {
        it.each([
            {label: '0n', input: 0n, expected: {value: 0, unit: ''}},
            {label: '1n', input: 1n, expected: {value: 0.001, unit: 'K'}},
            {label: '1 000n', input: 1000n, expected: {value: 1, unit: 'K'}},
            {label: '1 000 000n', input: 1000000n, expected: {value: 1000, unit: 'K'}}
        ])('forces K conversion for $label', ({input, expected}) => {
            expect(convertFractionalAdaptiveSI(input, 'K')).toEqual(expected);
        });

        it.each([
            {label: '1 000n', input: 1000n, expected: {value: 0.001, unit: 'M'}},
            {label: '1 000 000n', input: 1000000n, expected: {value: 1, unit: 'M'}},
            {label: '1 000 000 000n', input: 1000000000n, expected: {value: 1000, unit: 'M'}}
        ])('forces M conversion for $label', ({input, expected}) => {
            expect(convertFractionalAdaptiveSI(input, 'M')).toEqual(expected);
        });

        it.each([
            {label: '1 000 000n', input: 1000000n, expected: {value: 0.001, unit: 'G'}},
            {label: '1 000 000 000n', input: 1000000000n, expected: {value: 1, unit: 'G'}}
        ])('forces G conversion for $label', ({input, expected}) => {
            expect(convertFractionalAdaptiveSI(input, 'G')).toEqual(expected);
        });

        it.each([
            {label: '1 000 000 000n', input: 1000000000n, expected: {value: 0.001, unit: 'T'}},
            {label: '1 000 000 000 000n', input: 1000000000000n, expected: {value: 1, unit: 'T'}}
        ])('forces T conversion for $label', ({input, expected}) => {
            expect(convertFractionalAdaptiveSI(input, 'T')).toEqual(expected);
        });

        it('returns empty unit when forced value is 0', () => {
            expect(convertFractionalAdaptiveSI(0n, 'T')).toEqual({value: 0, unit: ''});
            expect(convertFractionalAdaptiveSI(0n, 'K')).toEqual({value: 0, unit: ''});
        });

        it('forces empty unit', () => {
            expect(convertFractionalAdaptiveSI(1000n, '')).toEqual({value: 1000, unit: ''});
            expect(convertFractionalAdaptiveSI(1000000n, '')).toEqual({value: 1000000, unit: ''});
        });

        it('returns undefined for invalid forceUnit', () => {
            expect(convertFractionalAdaptiveSI(1000n, 'X' as any)).toBeUndefined();
        });
    });
});
