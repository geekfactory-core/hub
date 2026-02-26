import {describe, expect, it} from 'vitest';
import {mergeClassName} from './domUtils';

describe('domUtils', () => {
    describe('mergeClassName', () => {
        it('returns empty string when called with no arguments', () => {
            expect(mergeClassName()).toBe('');
        });

        it('returns empty string when all inputs are null, undefined, or empty', () => {
            expect(mergeClassName(undefined, null, '', '  ')).toBe('');
        });

        it('merges multiple class names into a space-separated string', () => {
            expect(mergeClassName('class1', 'class2', 'class3')).toBe('class1 class2 class3');
        });

        it('splits space-separated classes within a single argument', () => {
            expect(mergeClassName('class1 class2', 'class3 class4')).toBe('class1 class2 class3 class4');
        });

        it('removes duplicate class names', () => {
            expect(mergeClassName('class1', 'class2', 'class1', 'class1 class2', 'class3')).toBe('class1 class2 class3');
        });

        it('trims whitespace from class names', () => {
            expect(mergeClassName('  class1  ', '  class2  ')).toBe('class1 class2');
        });

        it.each([
            {label: 'null', args: ['class1', null, 'class2'] as Array<string | null | undefined>},
            {label: 'undefined', args: ['class1', undefined, 'class2'] as Array<string | null | undefined>},
            {label: 'empty string', args: ['class1', '', 'class2'] as Array<string | null | undefined>}
        ])('filters out $label values', ({args}) => {
            expect(mergeClassName(...args)).toBe('class1 class2');
        });

        it('handles a mix of valid, nullish, duplicate, and whitespace inputs', () => {
            expect(mergeClassName('class1 class2', undefined, 'class3', 'class1', null, '  class4  ')).toBe('class1 class2 class3 class4');
        });
    });
});
