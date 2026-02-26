import {describe, expect, it} from 'vitest';
import {isNonEmptyString, trimIfDefined} from './string';

describe('String utilities', () => {
    describe('isNonEmptyString', () => {
        it.each([
            {label: '"hello"', input: 'hello'},
            {label: '"a"', input: 'a'},
            {label: 'space', input: ' '}
        ])('returns true for non-empty string $label', ({input}) => {
            expect(isNonEmptyString(input)).toBe(true);
        });

        it('returns false for empty string', () => {
            expect(isNonEmptyString('')).toBe(false);
        });

        it.each([
            {label: 'null', input: null},
            {label: 'undefined', input: undefined},
            {label: 'number', input: 123},
            {label: 'object', input: {}},
            {label: 'array', input: []},
            {label: 'boolean', input: true}
        ] as const)('returns false for non-string value: $label', ({input}) => {
            expect(isNonEmptyString(input)).toBe(false);
        });

        it('narrows type to string', () => {
            expect.assertions(1);
            const value: unknown = 'hello';
            if (isNonEmptyString(value)) {
                const _narrowed: string = value;
                expect(_narrowed).toBe('hello');
            }
        });
    });

    describe('trimIfDefined', () => {
        it.each([
            {label: '"  hello  "', input: '  hello  ', expected: 'hello'},
            {label: '"world"', input: 'world', expected: 'world'},
            {label: '" a "', input: ' a ', expected: 'a'}
        ])('returns trimmed string for $label', ({input, expected}) => {
            expect(trimIfDefined(input)).toBe(expected);
        });

        it.each([
            {label: 'spaces only', input: '   '},
            {label: 'empty string', input: ''},
            {label: 'tab+newline', input: '\t\n'}
        ])('returns undefined for whitespace-only string: $label', ({input}) => {
            expect(trimIfDefined(input)).toBeUndefined();
        });

        it.each([
            {label: 'null', input: null},
            {label: 'undefined', input: undefined},
            {label: 'number', input: 123},
            {label: 'object', input: {}},
            {label: 'array', input: []},
            {label: 'boolean', input: true}
        ] as const)('returns undefined for non-string value: $label', ({input}) => {
            expect(trimIfDefined(input)).toBeUndefined();
        });
    });
});
