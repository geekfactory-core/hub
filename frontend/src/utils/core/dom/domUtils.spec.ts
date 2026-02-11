import {describe, expect, it} from 'vitest';
import {mergeClassName} from './domUtils';

describe('domUtils', () => {
    describe('mergeClassName', () => {
        it('should merge multiple class names', () => {
            const result = mergeClassName('class1', 'class2', 'class3');
            expect(result).toBe('class1 class2 class3');
        });

        it('should handle undefined and null values', () => {
            const result = mergeClassName('class1', undefined, 'class2', null, 'class3');
            expect(result).toBe('class1 class2 class3');
        });

        it('should handle empty strings', () => {
            const result = mergeClassName('class1', '', 'class2');
            expect(result).toBe('class1 class2');
        });

        it('should split multiple classes in a single string', () => {
            const result = mergeClassName('class1 class2', 'class3 class4');
            expect(result).toBe('class1 class2 class3 class4');
        });

        it('should remove duplicate classes', () => {
            const result = mergeClassName('class1', 'class2', 'class1', 'class1 class2', 'class3');
            expect(result).toBe('class1 class2 class3');
        });

        it('should handle whitespace and trim classes', () => {
            const result = mergeClassName('  class1  ', '  class2  ');
            expect(result).toBe('class1 class2');
        });

        it('should return empty string when all inputs are empty or null', () => {
            const result = mergeClassName(undefined, null, '', '  ');
            expect(result).toBe('');
        });

        it('should handle mixed scenarios', () => {
            const result = mergeClassName('class1 class2', undefined, 'class3', 'class1', null, '  class4  ');
            expect(result).toBe('class1 class2 class3 class4');
        });
    });
});
