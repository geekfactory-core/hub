import {describe, expect, test} from 'vitest';
import {getBufferedDeploymentExpensesAmountUlps, getDeploymentCostBufferCycles, getDeploymentExpensesAmountUlps, roundE8sCeil} from './deploymentExpensesCalculator';

describe('ExpensesCalculator', () => {
    describe('getDeploymentExpensesAmountUlps', () => {
        test('calculates expenses with cost + cycles', () => {
            expect(getDeploymentExpensesAmountUlps(50_000n, 1_000_000n, 10_000n)).toBe(105n);
            expect(getDeploymentExpensesAmountUlps(1_000_000n, 1_000_000n, 30_000n)).toBe(66n);
        });

        test('returns 0 when all inputs are zero', () => {
            expect(getDeploymentExpensesAmountUlps(0n, 0n, 30_000n)).toBe(0n);
        });

        test('throws on division by zero', () => {
            expect(() => getDeploymentExpensesAmountUlps(0n, 0n, 0n)).toThrow();
        });
    });

    describe('getBufferedDeploymentExpensesAmountUlps', () => {
        describe('with 8 decimals', () => {
            test('applies buffer correctly', () => {
                expect(getBufferedDeploymentExpensesAmountUlps(110n, 0n, 8)).toBe(110n);
                expect(getBufferedDeploymentExpensesAmountUlps(110n, 1_000n, 8)).toBe(121n);
                expect(getBufferedDeploymentExpensesAmountUlps(105n, 1_000n, 8)).toBe(115n);
                expect(getBufferedDeploymentExpensesAmountUlps(100n, 1_000n, 8)).toBe(110n);
            });
        });

        describe('with 7 decimals', () => {
            test('applies buffer correctly and rounds up', () => {
                expect(getBufferedDeploymentExpensesAmountUlps(110n, 1_000n, 7)).toBe(130n);
                expect(getBufferedDeploymentExpensesAmountUlps(105n, 1_000n, 7)).toBe(120n);
                expect(getBufferedDeploymentExpensesAmountUlps(100n, 1_000n, 7)).toBe(110n);
                expect(getBufferedDeploymentExpensesAmountUlps(50n, 1_000n, 7)).toBe(60n);
                expect(getBufferedDeploymentExpensesAmountUlps(5n, 1_000n, 7)).toBe(10n);
            });
        });

        describe('with 0 decimals', () => {
            test('rounds up to full ICP', () => {
                expect(getBufferedDeploymentExpensesAmountUlps(5n, 1_000n, 0)).toBe(100_000_000n);
            });
        });

        describe('getBufferedDeploymentExpensesAmountUlps — rounding across decimal places', () => {
            const amount = 1_1111_1111n;
            const buffer = 0n;

            test('rounds gradually from 8 decimals down to 0', () => {
                expect(getBufferedDeploymentExpensesAmountUlps(amount, buffer, 8)).toBe(1_1111_1111n);
                expect(getBufferedDeploymentExpensesAmountUlps(amount, buffer, 7)).toBe(1_1111_1120n);
                expect(getBufferedDeploymentExpensesAmountUlps(amount, buffer, 6)).toBe(1_1111_1200n);
                expect(getBufferedDeploymentExpensesAmountUlps(amount, buffer, 5)).toBe(1_1111_2000n);
                expect(getBufferedDeploymentExpensesAmountUlps(amount, buffer, 4)).toBe(1_1112_0000n);
                expect(getBufferedDeploymentExpensesAmountUlps(amount, buffer, 3)).toBe(1_1120_0000n);
                expect(getBufferedDeploymentExpensesAmountUlps(amount, buffer, 2)).toBe(1_1200_0000n);
                expect(getBufferedDeploymentExpensesAmountUlps(amount, buffer, 1)).toBe(1_2000_0000n);
                expect(getBufferedDeploymentExpensesAmountUlps(amount, buffer, 0)).toBe(2_0000_0000n);
            });
        });
    });

    describe('roundE8sCeil', () => {
        describe('valid rounding', () => {
            test('handles zero correctly', () => {
                expect(roundE8sCeil(0n, 0)).toBe(0n);
                expect(roundE8sCeil(0n, 8)).toBe(0n);
            });

            test('rounds to whole ICP when decimalPlaces = 0', () => {
                expect(roundE8sCeil(1n, 0)).toBe(1_0000_0000n);
                expect(roundE8sCeil(1_0000_0000n, 0)).toBe(1_0000_0000n);
                expect(roundE8sCeil(1_0000_0001n, 0)).toBe(2_0000_0000n);
                expect(roundE8sCeil(1_5000_0000n, 0)).toBe(2_0000_0000n);
            });

            test('rounds with 2 decimal places', () => {
                expect(roundE8sCeil(1_2345_6789n, 2)).toBe(1_2400_0000n);
                expect(roundE8sCeil(1_2340_0000n, 2)).toBe(1_2400_0000n);
            });

            test('rounds with 3 decimal places', () => {
                expect(roundE8sCeil(1_2345_6789n, 3)).toBe(1_2350_0000n);
                expect(roundE8sCeil(1_2340_0000n, 3)).toBe(1_2340_0000n);
            });

            test('rounds with 8 decimal places (no change)', () => {
                expect(roundE8sCeil(1_2345_6789n, 8)).toBe(1_2345_6789n);
            });
        });

        describe('invalid decimalPlaces', () => {
            test('throws when decimalPlaces > 8', () => {
                expect(() => roundE8sCeil(1_2345_6789n, 9)).toThrow();
            });

            test('throws when decimalPlaces < 0', () => {
                expect(() => roundE8sCeil(1_0000_0000n, -1)).toThrow();
            });
        });
    });

    describe('getDeploymentCostBufferCycles', () => {
        test('calculates fee with buffer', () => {
            expect(getDeploymentCostBufferCycles(1_000n, 1_000n, 1_000n)).toBe(200n);
            expect(getDeploymentCostBufferCycles(1_000n, 1_567n, 1_000n)).toBe(256n);
            expect(getDeploymentCostBufferCycles(1_000_000n, 1_000_000n, 1_000n)).toBe(200_000n);
        });

        test('returns 0 when all inputs are zero', () => {
            expect(getDeploymentCostBufferCycles(0n, 0n, 0n)).toBe(0n);
        });
    });
});
