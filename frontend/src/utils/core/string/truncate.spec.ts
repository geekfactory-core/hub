import {describe, expect, it} from 'vitest';
import {truncateEnd, truncateMiddle} from './truncate';

describe('truncateMiddle', () => {
    it('should return empty string for null/undefined input', () => {
        expect(truncateMiddle(null as any, 5)).toBe('');
        expect(truncateMiddle(undefined as any, 5)).toBe('');
    });

    it('should return empty string for zero or negative length', () => {
        expect(truncateMiddle('Hello', 0)).toBe('');
        expect(truncateMiddle('Hello', -1)).toBe('');
    });

    it('should return original string if it fits within length', () => {
        expect(truncateMiddle('Hello', 5)).toBe('Hello');
        expect(truncateMiddle('Hi', 10)).toBe('Hi');
        expect(truncateMiddle('', 5)).toBe('');
    });

    it('should truncate in the middle with default ellipsis', () => {
        expect(truncateMiddle('Hello World', 5)).toBe('H...d');
        expect(truncateMiddle('Hello World', 6)).toBe('He...d');
        expect(truncateMiddle('Hello World', 7)).toBe('He...ld');
        expect(truncateMiddle('Hello World', 8)).toBe('Hel...ld');
    });

    it('should handle custom ellipsis', () => {
        expect(truncateMiddle('Hello World', 7, '--')).toBe('Hel--ld');
        expect(truncateMiddle('Hello World', 6, '***')).toBe('He***d');
    });

    it('should handle length equal to ellipsis length', () => {
        expect(truncateMiddle('Hello World', 3)).toBe('...');
        expect(truncateMiddle('Hello World', 2, '**')).toBe('**');
    });

    it('should handle length less than ellipsis length', () => {
        expect(truncateMiddle('Hello World', 2)).toBe('..');
        expect(truncateMiddle('Hello World', 1)).toBe('.');
        expect(truncateMiddle('Hello World', 1, '****')).toBe('*');
    });
});

describe('truncateEnd', () => {
    it('should return empty string for null/undefined input', () => {
        expect(truncateEnd(null as any, 5)).toBe('');
        expect(truncateEnd(undefined as any, 5)).toBe('');
    });

    it('should return empty string for zero or negative length', () => {
        expect(truncateEnd('Hello', 0)).toBe('');
        expect(truncateEnd('Hello', -1)).toBe('');
    });

    it('should return original string if it fits within length', () => {
        expect(truncateEnd('Hello', 5)).toBe('Hello');
        expect(truncateEnd('Hi', 10)).toBe('Hi');
        expect(truncateEnd('', 5)).toBe('');
    });

    it('should truncate at the end with default ellipsis', () => {
        expect(truncateEnd('Hello World', 5)).toBe('He...');
        expect(truncateEnd('Hello World', 6)).toBe('Hel...');
        expect(truncateEnd('Hello World', 8)).toBe('Hello...');
    });

    it('should handle custom ellipsis', () => {
        expect(truncateEnd('Hello World', 7, '--')).toBe('Hello--');
        expect(truncateEnd('Hello World', 6, '***')).toBe('Hel***');
    });

    it('should handle length equal to ellipsis length', () => {
        expect(truncateEnd('Hello World', 3)).toBe('...');
        expect(truncateEnd('Hello World', 2, '**')).toBe('**');
    });

    it('should handle length less than ellipsis length', () => {
        expect(truncateEnd('Hello World', 2)).toBe('..');
        expect(truncateEnd('Hello World', 1)).toBe('.');
        expect(truncateEnd('Hello World', 1, '****')).toBe('*');
    });
});
