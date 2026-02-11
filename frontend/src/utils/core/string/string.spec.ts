import {describe, expect, it} from 'vitest';
import {isNonEmptyString, trimIfDefined} from './string';

describe('String utilities', () => {
    describe('isNonEmptyString', () => {
        it('should return true for non-empty strings', () => {
            expect(isNonEmptyString('hello')).toBe(true);
            expect(isNonEmptyString('a')).toBe(true);
            expect(isNonEmptyString(' ')).toBe(true);
        });

        it('should return false for empty strings', () => {
            expect(isNonEmptyString('')).toBe(false);
        });

        it('should return false for non-string values', () => {
            expect(isNonEmptyString(null)).toBe(false);
            expect(isNonEmptyString(undefined)).toBe(false);
            expect(isNonEmptyString(123)).toBe(false);
            expect(isNonEmptyString({})).toBe(false);
            expect(isNonEmptyString([])).toBe(false);
            expect(isNonEmptyString(true)).toBe(false);
        });
    });

    describe('trimIfDefined', () => {
        it('should return trimmed string for valid non-empty strings', () => {
            expect(trimIfDefined('  hello  ')).toBe('hello');
            expect(trimIfDefined('world')).toBe('world');
            expect(trimIfDefined(' a ')).toBe('a');
        });

        it('should return undefined for strings that become empty after trimming', () => {
            expect(trimIfDefined('   ')).toBeUndefined();
            expect(trimIfDefined('')).toBeUndefined();
            expect(trimIfDefined('\t\n')).toBeUndefined();
        });

        it('should return undefined for non-string values', () => {
            expect(trimIfDefined(null)).toBeUndefined();
            expect(trimIfDefined(undefined)).toBeUndefined();
            expect(trimIfDefined(123)).toBeUndefined();
            expect(trimIfDefined({})).toBeUndefined();
            expect(trimIfDefined([])).toBeUndefined();
            expect(trimIfDefined(true)).toBeUndefined();
        });
    });
});
