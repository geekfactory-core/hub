import {toError} from 'frontend/src/utils/core/error/toError';
import type {Logger} from 'frontend/src/utils/logger/Logger';

export const PERMYRIAD_DENOMINATOR = 10_000n;

export type Expenses = {
    deploymentCostCycles: bigint;
    contractTemplateInitialCycles: bigint;
    deploymentCostBufferCycles: bigint;
    totalRequiredCycles: bigint;

    xdrPermyriadPerIcp: bigint;

    bufferedExpensesAmountUlps: bigint;
    icrcLedgerFeeUlps: bigint;
    totalCostUlps: bigint;

    deploymentAllowanceExpirationTimeoutMillis: bigint;
};

type DeploymentExpensesResultSuccess = {type: 'success'; expenses: Expenses};
type DeploymentExpensesResultError = {type: 'error'; error: Error};
export type DeploymentExpensesResult = DeploymentExpensesResultSuccess | DeploymentExpensesResultError;

type Parameters = {
    contractTemplateInitialCycles: bigint;
    deploymentCostCycles: bigint;
    xdrPermyriadPerIcp: bigint;
    icrcLedgerFeeUlps: bigint;
    deploymentExpensesAmountBufferPermyriad: bigint;
    deploymentExpensesAmountDecimalPlaces: number;
    deploymentAllowanceExpirationTimeoutMillis: bigint;
    logger?: Logger;
};
export const calculateDeploymentExpenses = ({
    contractTemplateInitialCycles,
    deploymentCostCycles,
    xdrPermyriadPerIcp,
    icrcLedgerFeeUlps,
    deploymentExpensesAmountBufferPermyriad,
    deploymentExpensesAmountDecimalPlaces,
    deploymentAllowanceExpirationTimeoutMillis,
    logger
}: Parameters): DeploymentExpensesResult => {
    const logMessagePrefix = 'calculateDeploymentExpenses:';
    try {
        if (
            contractTemplateInitialCycles < 0n ||
            deploymentCostCycles < 0n ||
            xdrPermyriadPerIcp <= 0n ||
            deploymentExpensesAmountBufferPermyriad < 0n ||
            deploymentExpensesAmountDecimalPlaces < 0 ||
            deploymentExpensesAmountDecimalPlaces > 8 ||
            deploymentAllowanceExpirationTimeoutMillis < 0n
        ) {
            logger?.error(`${logMessagePrefix} invalid parameters`, {
                contractTemplateInitialCycles,
                deploymentCostCycles,
                xdrPermyriadPerIcp,
                deploymentExpensesAmountBufferPermyriad,
                deploymentExpensesAmountDecimalPlaces,
                deploymentAllowanceExpirationTimeoutMillis
            });
            return {type: 'error', error: new Error('Invalid parameters for calculating deployment expenses')};
        }

        const deploymentCostBufferCycles = getDeploymentCostBufferCycles(deploymentCostCycles, contractTemplateInitialCycles, deploymentExpensesAmountBufferPermyriad);
        const totalRequiredCycles = deploymentCostCycles + contractTemplateInitialCycles + deploymentCostBufferCycles;

        const deploymentExpensesAmountUlps = getDeploymentExpensesAmountUlps(deploymentCostCycles, contractTemplateInitialCycles, xdrPermyriadPerIcp);
        const bufferedExpensesAmountUlps = getBufferedDeploymentExpensesAmountUlps(deploymentExpensesAmountUlps, deploymentExpensesAmountBufferPermyriad, deploymentExpensesAmountDecimalPlaces);

        /**
         * Check if deployment cost if more than minimal possible cost (two ledger fees).
         * First fee is for transferring ICP from user account to canister deposit account (if needed).
         * Second fee is for transferring ICP in the canister.
         * See "deploy_contract.rs"
         */
        if (bufferedExpensesAmountUlps <= icrcLedgerFeeUlps * 2n) {
            logger?.debug(`${logMessagePrefix} buffered expenses amount is less than minimal possible cost (two ledger fees)`, {
                icrcLedgerFeeUlps,
                bufferedExpensesAmountUlps
            });
            return {type: 'error', error: new Error('Deployment buffered expenses amount is less than minimal possible cost (two ledger fees)')};
        }

        const totalCostUlps = bufferedExpensesAmountUlps + icrcLedgerFeeUlps;

        const expenses: Expenses = {
            deploymentCostCycles,
            contractTemplateInitialCycles,
            deploymentCostBufferCycles,
            totalRequiredCycles,

            xdrPermyriadPerIcp,

            bufferedExpensesAmountUlps,
            icrcLedgerFeeUlps,
            totalCostUlps,

            deploymentAllowanceExpirationTimeoutMillis
        };

        return {type: 'success', expenses};
    } catch (e) {
        logger?.error(`${logMessagePrefix} failed to calculate deployment expenses`, {error: toError(e)});
        return {type: 'error', error: toError(e)};
    }
};

export const getDeploymentExpensesAmountUlps = (deploymentCostCycles: bigint, contractTemplateInitialCycles: bigint, xdrPermyriadPerIcp: bigint): bigint => {
    try {
        const sum = deploymentCostCycles + contractTemplateInitialCycles;
        return divFloor(sum, xdrPermyriadPerIcp);
    } catch (e) {
        throw new Error('Failed to calculate deployment expenses amount', {cause: toError(e)});
    }
};

export const getBufferedDeploymentExpensesAmountUlps = (deploymentExpensesAmountUlps: bigint, deploymentExpensesAmountBufferPermyriad: bigint, amountDecimalPlaces: number): bigint => {
    try {
        const buffer = divFloor(deploymentExpensesAmountUlps * deploymentExpensesAmountBufferPermyriad, PERMYRIAD_DENOMINATOR);
        const sum = deploymentExpensesAmountUlps + buffer;
        const rounded = roundE8sCeil(sum, amountDecimalPlaces);
        return rounded;
    } catch (e) {
        throw new Error('Failed to calculate buffered deployment expenses amount', {cause: toError(e)});
    }
};

export const getDeploymentCostBufferCycles = (deploymentCostCycles: bigint, contractTemplateInitialCycles: bigint, deploymentExpensesAmountBufferPermyriad: bigint): bigint => {
    const sum = deploymentCostCycles + contractTemplateInitialCycles;
    const buffer = divFloor(sum * deploymentExpensesAmountBufferPermyriad, PERMYRIAD_DENOMINATOR);
    return buffer;
};

/* eslint-disable */
/**
 * Rounds an ICP amount (in e8s) up to the nearest multiple according to the specified decimal places.
 *
 * - The value is given in **e8s** (1 ICP = 1_0000_0000 e8s).
 * - `decimalPlaces` defines the precision after the decimal point in ICP:
 *   - `0` → round up to the nearest **whole ICP**
 *   - `2` → round up to the nearest **0.01 ICP**
 *   - `8` → no rounding (full precision in e8s)
 *
 * This is a **ceil rounding**: if the amount is not exactly divisible by the base unit,
 * it is rounded up to the next valid step.
 *
 * @param amount - The ICP amount in e8s (bigint).
 * @param decimalPlaces - Number of decimals to keep in ICP (0–8).
 * @returns The rounded amount in e8s.
 *
 * @throws {Error} If `decimalPlaces` is outside the range 0–8.
 *
 * @example
 * // 1.2345_6789 ICP in e8s
 * const amount = 1_2345_6789n;
 *
 * // Round up to whole ICP (0 decimal places)
 * roundE8sCeil(amount, 0);
 * // → 2_0000_0000n  (2 ICP)
 *
 * // Round up to 2 decimals (0.01 ICP steps)
 * roundE8sCeil(amount, 2);
 * // → 1_2400_0000n  (1.24 ICP)
 *
 * // Round up to 3 decimals (0.001 ICP steps)
 * roundE8sCeil(amount, 3);
 * // → 1_2350_0000n  (1.235 ICP)
 *
 * // Keep full precision (8 decimals)
 * roundE8sCeil(amount, 8);
 * // → 1_2345_6789n  (1.2345_6789 ICP, unchanged)
 */
/* eslint-enable */
export const roundE8sCeil = (amount: bigint, decimalPlaces: number): bigint => {
    try {
        if (decimalPlaces < 0 || decimalPlaces > 8) {
            throw new Error(`Decimal places for rounding deployment expenses amount must be in range 0-8`);
        }

        const base = 10n ** BigInt(8 - decimalPlaces);

        if (amount % base === 0n) {
            return amount;
        } else {
            return (amount / base + 1n) * base;
        }
    } catch (e) {
        throw new Error(`Failed to round deployment expenses amount`, {cause: toError(e)});
    }
};

/**
 * Integer division with truncation toward zero (same as JS/TypeScript bigint `/`).
 * This matches Rust's integer division semantics used by `checked_div` for non-negative values.
 * Throws on division by zero to mirror backend checks.
 */
const divFloor = (a: bigint, b: bigint): bigint => {
    if (b === 0n) {
        throw new Error('Division by zero');
    }
    /**
     * bigint division discards the remainder
     */
    return a / b;
};
