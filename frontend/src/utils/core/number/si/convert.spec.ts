import {describe, expect, it} from 'vitest';
import {convertFractionalAdaptiveSI} from './convert';

describe('convertFractionalAdaptiveSI', () => {
    it('should return undefined for undefined input', () => {
        expect(convertFractionalAdaptiveSI(undefined)).toBeUndefined();
    });

    it('should return undefined for negative values', () => {
        expect(convertFractionalAdaptiveSI(-1n)).toBeUndefined();
        expect(convertFractionalAdaptiveSI(-1000n)).toBeUndefined();
    });

    it('should return value with empty unit for zero', () => {
        expect(convertFractionalAdaptiveSI(0n)).toEqual({value: 0, unit: ''});
    });

    it('should return value with empty unit for values less than 1000', () => {
        expect(convertFractionalAdaptiveSI(1n)).toEqual({value: 1, unit: ''});
        expect(convertFractionalAdaptiveSI(999n)).toEqual({value: 999, unit: ''});
    });

    it('should convert to K unit for thousands', () => {
        expect(convertFractionalAdaptiveSI(1000n)).toEqual({value: 1, unit: 'K'});
        expect(convertFractionalAdaptiveSI(1500n)).toEqual({value: 1.5, unit: 'K'});
        expect(convertFractionalAdaptiveSI(999000n)).toEqual({value: 999, unit: 'K'});
    });

    it('should convert to M unit for millions', () => {
        expect(convertFractionalAdaptiveSI(1000000n)).toEqual({value: 1, unit: 'M'});
        expect(convertFractionalAdaptiveSI(2500000n)).toEqual({value: 2.5, unit: 'M'});
        expect(convertFractionalAdaptiveSI(999000000n)).toEqual({value: 999, unit: 'M'});
    });

    it('should convert to G unit for billions', () => {
        expect(convertFractionalAdaptiveSI(1000000000n)).toEqual({value: 1, unit: 'G'});
        expect(convertFractionalAdaptiveSI(3750000000n)).toEqual({value: 3.75, unit: 'G'});
        expect(convertFractionalAdaptiveSI(999000000000n)).toEqual({value: 999, unit: 'G'});
    });

    it('should convert to T unit for trillions', () => {
        expect(convertFractionalAdaptiveSI(1000000000000n)).toEqual({value: 1, unit: 'T'});
        expect(convertFractionalAdaptiveSI(5250000000000n)).toEqual({value: 5.25, unit: 'T'});
    });

    it('should cap at T unit for very large values', () => {
        expect(convertFractionalAdaptiveSI(1000000000000000n)).toEqual({value: 1000, unit: 'T'});
        expect(convertFractionalAdaptiveSI(5000000000000000n)).toEqual({value: 5000, unit: 'T'});
    });

    describe('with forceUnit parameter', () => {
        it('should force conversion to K unit', () => {
            expect(convertFractionalAdaptiveSI(0n, 'K')).toEqual({value: 0, unit: ''});
            expect(convertFractionalAdaptiveSI(1n, 'K')).toEqual({value: 0.001, unit: 'K'});
            expect(convertFractionalAdaptiveSI(1000n, 'K')).toEqual({value: 1, unit: 'K'});
            expect(convertFractionalAdaptiveSI(1000000n, 'K')).toEqual({value: 1000, unit: 'K'});
        });

        it('should force conversion to M unit', () => {
            expect(convertFractionalAdaptiveSI(1000n, 'M')).toEqual({value: 0.001, unit: 'M'});
            expect(convertFractionalAdaptiveSI(1000000n, 'M')).toEqual({value: 1, unit: 'M'});
            expect(convertFractionalAdaptiveSI(1000000000n, 'M')).toEqual({value: 1000, unit: 'M'});
        });

        it('should force conversion to G unit', () => {
            expect(convertFractionalAdaptiveSI(1000000n, 'G')).toEqual({value: 0.001, unit: 'G'});
            expect(convertFractionalAdaptiveSI(1000000000n, 'G')).toEqual({value: 1, unit: 'G'});
        });

        it('should force conversion to T unit', () => {
            expect(convertFractionalAdaptiveSI(1000000000n, 'T')).toEqual({value: 0.001, unit: 'T'});
            expect(convertFractionalAdaptiveSI(1000000000000n, 'T')).toEqual({value: 1, unit: 'T'});
        });

        it('should return empty unit when forced value is 0', () => {
            expect(convertFractionalAdaptiveSI(0n, 'T')).toEqual({value: 0, unit: ''});
            expect(convertFractionalAdaptiveSI(0n, 'K')).toEqual({value: 0, unit: ''});
        });

        it('should force empty unit', () => {
            expect(convertFractionalAdaptiveSI(1000n, '')).toEqual({value: 1000, unit: ''});
            expect(convertFractionalAdaptiveSI(1000000n, '')).toEqual({value: 1000000, unit: ''});
        });

        it('should return undefined for invalid forceUnit', () => {
            expect(convertFractionalAdaptiveSI(1000n, 'X' as any)).toBeUndefined();
        });
    });
});
