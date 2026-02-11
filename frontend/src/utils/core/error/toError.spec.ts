import {describe, expect, it} from 'vitest';
import {toError} from './toError';

describe('toError', () => {
    it('should convert string to Error with string as message', () => {
        const input = 'Test error message';
        const result = toError(input);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Test error message');
        expect(result.cause).toBe(input);
    });

    it('should convert object with message property to Error', () => {
        const input = {message: 'Object error message'};
        const result = toError(input);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Object error message');
        expect(result.cause).toBe(input);
    });

    describe('should handle object with non-string message property', () => {
        it('number', () => {
            const input = {message: 123};
            const result = toError(input);

            expect(result).toBeInstanceOf(Error);
            expect(result.message).toBe('Unknown error');
            expect(result.cause).toBe(input);
        });

        it('boolean', () => {
            const input = {message: true};
            const result = toError(input);

            expect(result).toBeInstanceOf(Error);
            expect(result.message).toBe('Unknown error');
            expect(result.cause).toBe(input);
        });

        it('Date', () => {
            const input = new Date();
            const result = toError(input);

            expect(result).toBeInstanceOf(Error);
            expect(result.message).toBe('Unknown error');
            expect(result.cause).toBe(input);
        });
    });

    it('should handle null input', () => {
        const result = toError(null);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Unknown error');
        expect(result.cause).toBe(null);
    });

    it('should handle undefined input', () => {
        const result = toError(undefined);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Unknown error');
        expect(result.cause).toBe(undefined);
    });

    it('should handle number input', () => {
        const input = 42;
        const result = toError(input);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Unknown error');
        expect(result.cause).toBe(input);
    });

    it('should handle boolean input', () => {
        const input = true;
        const result = toError(input);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Unknown error');
        expect(result.cause).toBe(input);
    });

    it('should handle Date input', () => {
        const input = new Date();
        const result = toError(input);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Unknown error');
        expect(result.cause).toBe(input);
    });

    it('should handle array input', () => {
        const input = [1, 2, 3];
        const result = toError(input);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Unknown error');
        expect(result.cause).toBe(input);
    });

    it('should handle function input', () => {
        const input = () => {};
        const result = toError(input);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Unknown error');
        expect(result.cause).toBe(input);
    });

    it('should handle symbol input', () => {
        const input = Symbol('test');
        const result = toError(input);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Unknown error');
        expect(result.cause).toBe(input);
    });

    it('should handle bigint input', () => {
        const input = 123n;
        const result = toError(input);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Unknown error');
        expect(result.cause).toBe(input);
    });

    it('should handle empty object input', () => {
        const input = {};
        const result = toError(input);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Unknown error');
        expect(result.cause).toBe(input);
    });

    it('should handle object without message property', () => {
        const input = {foo: 'bar'};
        const result = toError(input);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Unknown error');
        expect(result.cause).toBe(input);
    });

    it('should handle Error instance input', () => {
        const input = new Error('Original error');
        const result = toError(input);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe('Original error');
        expect(result.cause).toBeUndefined();
    });
});
