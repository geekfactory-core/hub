import {describe, expect, it} from 'vitest';
import {compactArray, isEmptyArray} from './array';

describe('array utilities', () => {
    describe('compactArray', () => {
        it('returns [] when input is empty', () => {
            expect(compactArray([])).toEqual([]);
        });

        it('filters out null and undefined values', () => {
            expect(compactArray([1, null, 2, undefined, 3, null])).toEqual([1, 2, 3]);
        });

        it('returns [] when all values are null or undefined', () => {
            expect(compactArray([null, undefined, null])).toEqual([]);
        });

        it('returns all values when none are nullish', () => {
            expect(compactArray([1, 2, 3])).toEqual([1, 2, 3]);
        });

        it('keeps falsy-but-not-nullish values: 0, false, empty string', () => {
            expect(compactArray([0, null, false, undefined, ''])).toEqual([0, false, '']);
        });

        it('works with string values', () => {
            expect(compactArray(['a', null, 'b', undefined])).toEqual(['a', 'b']);
        });

        it('works with object values', () => {
            const obj = {id: 1};
            expect(compactArray([obj, null, undefined])).toEqual([obj]);
        });
    });

    describe('isEmptyArray', () => {
        it.each<[string, null | undefined | Array<unknown>]>([
            ['null', null],
            ['undefined', undefined],
            ['empty array', []]
        ])('returns true for %s', (_, input) => {
            expect(isEmptyArray(input)).toBe(true);
        });

        it.each<[string, Array<unknown>]>([
            ['non-empty array', [1, 2, 3]],
            ['single-element array', [1]],
            ['array with null values', [null, undefined]],
            ['array with 0', [0]],
            ['array with false', [false]],
            ['array with empty string', ['']]
        ])('returns false for %s', (_, input) => {
            expect(isEmptyArray(input)).toBe(false);
        });

        it('narrows type to null | undefined | [] on true branch', () => {
            expect.assertions(1);
            const value: Array<number> | null | undefined = null;
            if (isEmptyArray(value)) {
                // compile-time check: if narrowing breaks, this assignment won't compile
                const _narrowed: null | undefined | [] = value;
                expect(_narrowed).toBeNull();
            }
        });
    });
});
