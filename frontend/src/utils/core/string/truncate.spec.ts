import {describe, expect, it} from 'vitest';
import {truncateEnd, truncateMiddle} from './truncate';

describe('truncateMiddle', () => {
    it.each([
        {label: 'null', input: null as any},
        {label: 'undefined', input: undefined as any}
    ])('returns empty string for $label input', ({input}) => {
        expect(truncateMiddle(input, 5)).toBe('');
    });

    it.each([{length: 0}, {length: -1}])('returns empty string for length=$length', ({length}) => {
        expect(truncateMiddle('Hello', length)).toBe('');
    });

    it.each([
        {label: 'exact fit', input: 'Hello', length: 5, expected: 'Hello'},
        {label: 'shorter', input: 'Hi', length: 10, expected: 'Hi'},
        {label: 'empty', input: '', length: 5, expected: ''}
    ])('returns original string when it fits ($label)', ({input, length, expected}) => {
        expect(truncateMiddle(input, length)).toBe(expected);
    });

    it.each([
        {length: 5, expected: 'H...d'},
        {length: 6, expected: 'He...d'},
        {length: 7, expected: 'He...ld'},
        {length: 8, expected: 'Hel...ld'}
    ])('truncates in the middle with default ellipsis at length=$length', ({length, expected}) => {
        expect(truncateMiddle('Hello World', length)).toBe(expected);
    });

    it.each([
        {length: 7, ellipsis: '--', expected: 'Hel--ld'},
        {length: 6, ellipsis: '***', expected: 'He***d'}
    ])('truncates in the middle with custom ellipsis "$ellipsis"', ({length, ellipsis, expected}) => {
        expect(truncateMiddle('Hello World', length, ellipsis)).toBe(expected);
    });

    it.each([
        {length: 3, ellipsis: '...', expected: '...'},
        {length: 2, ellipsis: '**', expected: '**'}
    ])('returns full ellipsis when length equals ellipsis length ($length)', ({length, ellipsis, expected}) => {
        expect(truncateMiddle('Hello World', length, ellipsis)).toBe(expected);
    });

    it.each([
        {length: 2, ellipsis: '...', expected: '..'},
        {length: 1, ellipsis: '...', expected: '.'},
        {length: 1, ellipsis: '****', expected: '*'}
    ])('truncates ellipsis when length is less than ellipsis length ($length)', ({length, ellipsis, expected}) => {
        expect(truncateMiddle('Hello World', length, ellipsis)).toBe(expected);
    });
});

describe('truncateEnd', () => {
    it.each([
        {label: 'null', input: null as any},
        {label: 'undefined', input: undefined as any}
    ])('returns empty string for $label input', ({input}) => {
        expect(truncateEnd(input, 5)).toBe('');
    });

    it.each([{length: 0}, {length: -1}])('returns empty string for length=$length', ({length}) => {
        expect(truncateEnd('Hello', length)).toBe('');
    });

    it.each([
        {label: 'exact fit', input: 'Hello', length: 5, expected: 'Hello'},
        {label: 'shorter', input: 'Hi', length: 10, expected: 'Hi'},
        {label: 'empty', input: '', length: 5, expected: ''}
    ])('returns original string when it fits ($label)', ({input, length, expected}) => {
        expect(truncateEnd(input, length)).toBe(expected);
    });

    it.each([
        {length: 5, expected: 'He...'},
        {length: 6, expected: 'Hel...'},
        {length: 8, expected: 'Hello...'}
    ])('truncates at the end with default ellipsis at length=$length', ({length, expected}) => {
        expect(truncateEnd('Hello World', length)).toBe(expected);
    });

    it.each([
        {length: 7, ellipsis: '--', expected: 'Hello--'},
        {length: 6, ellipsis: '***', expected: 'Hel***'}
    ])('truncates at the end with custom ellipsis "$ellipsis"', ({length, ellipsis, expected}) => {
        expect(truncateEnd('Hello World', length, ellipsis)).toBe(expected);
    });

    it.each([
        {length: 3, ellipsis: '...', expected: '...'},
        {length: 2, ellipsis: '**', expected: '**'}
    ])('returns full ellipsis when length equals ellipsis length ($length)', ({length, ellipsis, expected}) => {
        expect(truncateEnd('Hello World', length, ellipsis)).toBe(expected);
    });

    it.each([
        {length: 2, ellipsis: '...', expected: '..'},
        {length: 1, ellipsis: '...', expected: '.'},
        {length: 1, ellipsis: '****', expected: '*'}
    ])('truncates ellipsis when length is less than ellipsis length ($length)', ({length, ellipsis, expected}) => {
        expect(truncateEnd('Hello World', length, ellipsis)).toBe(expected);
    });
});
