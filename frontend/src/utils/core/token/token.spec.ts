import {ICPToken, type Token} from '@dfinity/utils';
import {describe, expect, it} from 'vitest';
import {formatNNSTokenAmount, formatTokenAmount, formatTokenAmountWithSymbol} from './token';

const ICP: Token = ICPToken;

describe('token', () => {
    describe('formatTokenAmount', () => {
        it('returns fallback for undefined', () => {
            expect(formatTokenAmount(undefined, ICP)).toBe('-');
            expect(formatTokenAmount(undefined, ICP, {fallback: 'n/a'})).toBe('n/a');
        });

        it.each([
            {label: '0n', input: 0n, expected: '0'},
            {label: '1n', input: 1n, expected: '0.00000001'},
            {label: '100000000n', input: 100000000n, expected: '1'},
            {label: '123456789n', input: 123456789n, expected: '1.23456789'}
        ])('formats $label with default decimals', ({input, expected}) => {
            expect(formatTokenAmount(input, ICP)).toBe(expected);
        });

        it.each([
            {label: 'maxDecimalPlaces: 2 truncates tiny value to "0"', input: 1n, options: {maxDecimalPlaces: 2}, expected: '0'},
            {label: 'maxDecimalPlaces: 2, minDecimalPlaces: 2 pads tiny value to "0.00"', input: 1n, options: {maxDecimalPlaces: 2, minDecimalPlaces: 2}, expected: '0.00'},
            {label: 'maxDecimalPlaces: 2 truncates fractional part', input: 123456789n, options: {maxDecimalPlaces: 2}, expected: '1.23'},
            {label: 'maxDecimalPlaces: 4 rounds up', input: 123456789n, options: {maxDecimalPlaces: 4}, expected: '1.2346'},
            {label: 'maxDecimalPlaces: 4, minDecimalPlaces: 5 truncates then pads', input: 123456789n, options: {maxDecimalPlaces: 4, minDecimalPlaces: 5}, expected: '1.23460'}
        ] as const)('$label', ({input, options, expected}) => {
            expect(formatTokenAmount(input, ICP, options)).toBe(expected);
        });
    });

    describe('formatTokenAmountWithSymbol', () => {
        it('returns fallback for undefined', () => {
            expect(formatTokenAmountWithSymbol(undefined, ICP)).toBe('-');
            expect(formatTokenAmountWithSymbol(undefined, ICP, {fallback: 'n/a'})).toBe('n/a');
        });

        it.each([
            {label: '0n', input: 0n, expected: '0 ICP'},
            {label: '1n', input: 1n, expected: '0.00000001 ICP'},
            {label: '100000000n', input: 100000000n, expected: '1 ICP'},
            {label: '123456789n', input: 123456789n, expected: '1.23456789 ICP'}
        ])('formats $label with symbol', ({input, expected}) => {
            expect(formatTokenAmountWithSymbol(input, ICP)).toBe(expected);
        });

        it.each([
            {label: 'maxDecimalPlaces: 2 truncates tiny value to "0 ICP"', input: 1n, options: {maxDecimalPlaces: 2}, expected: '0 ICP'},
            {label: 'maxDecimalPlaces: 2, minDecimalPlaces: 2 pads tiny value to "0.00 ICP"', input: 1n, options: {maxDecimalPlaces: 2, minDecimalPlaces: 2}, expected: '0.00 ICP'},
            {label: 'maxDecimalPlaces: 2 truncates fractional part', input: 123456789n, options: {maxDecimalPlaces: 2}, expected: '1.23 ICP'},
            {label: 'maxDecimalPlaces: 4 rounds up', input: 123456789n, options: {maxDecimalPlaces: 4}, expected: '1.2346 ICP'},
            {label: 'maxDecimalPlaces: 4, minDecimalPlaces: 5 truncates then pads', input: 123456789n, options: {maxDecimalPlaces: 4, minDecimalPlaces: 5}, expected: '1.23460 ICP'}
        ] as const)('$label', ({input, options, expected}) => {
            expect(formatTokenAmountWithSymbol(input, ICP, options)).toBe(expected);
        });
    });

    describe('formatNNSTokenAmount', () => {
        it('returns fallback for undefined', () => {
            expect(formatNNSTokenAmount(undefined, ICP)).toBe('-');
            expect(formatNNSTokenAmount(undefined, ICP, {fallback: 'n/a'})).toBe('n/a');
        });

        it('returns "0" for zero', () => {
            expect(formatNNSTokenAmount(0n, ICP)).toBe('0');
        });

        it.each([
            {input: 1n, expected: '0.00000001'},
            {input: 10000n, expected: '0.0001'},
            {input: 900000n, expected: '0.009'},
            {input: 999999n, expected: '0.00999999'}
        ])('uses 8 decimal places for $input (< 0.01)', ({input, expected}) => {
            expect(formatNNSTokenAmount(input, ICP)).toBe(expected);
        });

        it.each([
            {input: 1000000n, expected: '0.01'},
            {input: 198765432n, expected: '1.99'},
            {input: 100000000n, expected: '1.00'},
            {input: 110000000n, expected: '1.10'}
        ])('uses 2 decimal places for $input (>= 0.01)', ({input, expected}) => {
            expect(formatNNSTokenAmount(input, ICP)).toBe(expected);
        });
    });
});
