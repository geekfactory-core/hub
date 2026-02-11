import {ICPToken, type Token} from '@dfinity/utils';
import {describe, expect, test} from 'vitest';
import {formatNNSTokenAmount, formatTokenAmount, formatTokenAmountWithSymbol} from './token';

const ICP: Token = ICPToken;

describe('token', () => {
    describe('formatTokenAmount', () => {
        test('returns fallback for undefined', () => {
            expect(formatTokenAmount(undefined, ICP)).toBe('-');
            expect(formatTokenAmount(undefined, ICP, {fallback: 'n/a'})).toBe('n/a');
        });

        test('formats amount with default decimals', () => {
            expect(formatTokenAmount(0n, ICP)).toBe('0');
            expect(formatTokenAmount(1n, ICP)).toBe('0.00000001');
            expect(formatTokenAmount(100000000n, ICP)).toBe('1');
            expect(formatTokenAmount(123456789n, ICP)).toBe('1.23456789');
        });

        test('formats amount with custom decimals', () => {
            expect(formatTokenAmount(1n, ICP, {maxDecimalPlaces: 2})).toBe('0');
            expect(formatTokenAmount(1n, ICP, {maxDecimalPlaces: 2, minDecimalPlaces: 2})).toBe('0.00');
            expect(formatTokenAmount(123456789n, ICP, {maxDecimalPlaces: 2})).toBe('1.23');
            expect(formatTokenAmount(123456789n, ICP, {maxDecimalPlaces: 4})).toBe('1.2346');
            expect(formatTokenAmount(123456789n, ICP, {maxDecimalPlaces: 4, minDecimalPlaces: 5})).toBe('1.23460');
        });
    });

    describe('formatTokenAmountWithSymbol', () => {
        test('returns fallback for undefined', () => {
            expect(formatTokenAmountWithSymbol(undefined, ICP)).toBe('-');
            expect(formatTokenAmountWithSymbol(undefined, ICP, {fallback: 'n/a'})).toBe('n/a');
        });

        test('formats amount with symbol', () => {
            expect(formatTokenAmountWithSymbol(0n, ICP)).toBe('0 ICP');
            expect(formatTokenAmountWithSymbol(1n, ICP)).toBe('0.00000001 ICP');
            expect(formatTokenAmountWithSymbol(100000000n, ICP)).toBe('1 ICP');
            expect(formatTokenAmountWithSymbol(123456789n, ICP)).toBe('1.23456789 ICP');
        });

        test('respects custom decimals', () => {
            expect(formatTokenAmountWithSymbol(1n, ICP, {maxDecimalPlaces: 2})).toBe('0 ICP');
            expect(formatTokenAmountWithSymbol(1n, ICP, {maxDecimalPlaces: 2, minDecimalPlaces: 2})).toBe('0.00 ICP');
            expect(formatTokenAmountWithSymbol(123456789n, ICP, {maxDecimalPlaces: 2})).toBe('1.23 ICP');
            expect(formatTokenAmountWithSymbol(123456789n, ICP, {maxDecimalPlaces: 4})).toBe('1.2346 ICP');
            expect(formatTokenAmountWithSymbol(123456789n, ICP, {maxDecimalPlaces: 4, minDecimalPlaces: 5})).toBe('1.23460 ICP');
        });
    });

    describe('formatNNSTokenAmount', () => {
        test('returns fallback for undefined', () => {
            expect(formatNNSTokenAmount(undefined, ICP)).toBe('-');
            expect(formatNNSTokenAmount(undefined, ICP, {fallback: 'n/a'})).toBe('n/a');
        });

        test('returns "0" for zero', () => {
            expect(formatNNSTokenAmount(0n, ICP)).toBe('0');
        });

        test('uses 8 decimal places for amounts less than 0.01', () => {
            expect(formatNNSTokenAmount(1n, ICP)).toBe('0.00000001');
            expect(formatNNSTokenAmount(10000n, ICP)).toBe('0.0001');
            expect(formatNNSTokenAmount(900000n, ICP)).toBe('0.009');
            expect(formatNNSTokenAmount(999999n, ICP)).toBe('0.00999999');
        });

        test('uses 2 decimal places for amounts >= 0.01', () => {
            expect(formatNNSTokenAmount(1000000n, ICP)).toBe('0.01');
            expect(formatNNSTokenAmount(198765432n, ICP)).toBe('1.99');
            expect(formatNNSTokenAmount(100000000n, ICP)).toBe('1.00');
            expect(formatNNSTokenAmount(110000000n, ICP)).toBe('1.10');
        });
    });
});
