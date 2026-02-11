import {describe, expect, it} from 'vitest';
import {compactArray, isEmptyArray} from './array';

describe('array utilities', () => {
    describe('compactArray', () => {
        it('should remove null and undefined values', () => {
            const input = [1, null, 2, undefined, 3, null];
            const result = compactArray(input);
            expect(result).toEqual([1, 2, 3]);
        });

        it('should return empty array when all values are null or undefined', () => {
            const input = [null, undefined, null];
            const result = compactArray(input);
            expect(result).toEqual([]);
        });

        it('should return same array when no null or undefined values', () => {
            const input = [1, 2, 3];
            const result = compactArray(input);
            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe('isEmptyArray', () => {
        it('should return true for null', () => {
            expect(isEmptyArray(null)).toBe(true);
        });

        it('should return true for undefined', () => {
            expect(isEmptyArray(undefined)).toBe(true);
        });

        it('should return true for empty array', () => {
            expect(isEmptyArray([])).toBe(true);
        });

        it('should return false for non-empty array', () => {
            expect(isEmptyArray([1, 2, 3])).toBe(false);
        });

        it('should return false for array with null values', () => {
            expect(isEmptyArray([null, undefined])).toBe(false);
        });
    });
});
