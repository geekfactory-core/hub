import {describe, expect, it} from 'vitest';
import {toError} from './toError';

describe('toError', () => {
    it('returns the same Error instance when input is already an Error', () => {
        const input = new Error('Original error');
        const result = toError(input);

        expect(result).toBe(input);
        expect(result.message).toBe('Original error');
        expect(result.cause).toBeUndefined();
    });

    it('uses input as message when input is a string', () => {
        expect(toError('Test error message')).toMatchObject({
            message: 'Test error message',
            cause: 'Test error message'
        });
    });

    it('uses object.message when input is an object with a string message property', () => {
        const input = {message: 'Object error message'};
        expect(toError(input)).toMatchObject({
            message: 'Object error message',
            cause: input
        });
    });

    it('uses empty string message when input is an object with message: ""', () => {
        const input = {message: ''};
        const result = toError(input);
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('');
        expect(result.cause).toBe(input);
    });

    describe('returns Error with "Unknown error" message', () => {
        it.each([
            {label: 'null', input: null},
            {label: 'undefined', input: undefined},
            {label: 'number', input: 42},
            {label: 'boolean', input: true},
            {label: 'bigint', input: 123n},
            {label: 'symbol', input: Symbol('test')},
            {label: 'array', input: [1, 2, 3]},
            {label: 'function', input: () => {}},
            {label: 'Date', input: new Date()},
            {label: 'empty object', input: {}},
            {label: 'object without message property', input: {foo: 'bar'}},
            {label: 'object with non-string message (number)', input: {message: 123}},
            {label: 'object with non-string message (boolean)', input: {message: true}},
            {label: 'object with non-string message (null)', input: {message: null}}
        ])('for $label', ({input}) => {
            const result = toError(input);

            expect(result).toBeInstanceOf(Error);
            expect(result.message).toBe('Unknown error');
            expect(result.cause).toBe(input);
        });
    });
});
