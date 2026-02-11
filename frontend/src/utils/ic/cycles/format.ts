import {ICPToken} from '@dfinity/utils';
import {PERMYRIAD_DENOMINATOR} from 'frontend/src/components/pages/contractTemplate/deployContractModal/deploymentExpensesCalculator';
import {formatNumberWithUnit, formatValueWithUnit, type Options} from '../../core/number/format';
import {convertFractionalAdaptiveSI} from '../../core/number/si/convert';
import type {ValueWithUnit} from '../../core/number/types';

const UNIT_SPACE = '';
const DECIMAL_PLACES = 12;

export const formatCycles = (cycles: bigint | undefined, options?: Options): string => {
    return formatCyclesValueWithUnit(convertFractionalAdaptiveSI(cycles), options);
};

export const formatCyclesValueWithUnit = (valueWithUnit: ValueWithUnit | undefined, options?: Options): string => {
    const {decimalPlaces = DECIMAL_PLACES, fallback} = options || {};
    return formatValueWithUnit(valueWithUnit, {decimalPlaces, fallback, unitSpace: UNIT_SPACE});
};

export const formatIcpXdrConversionRateInTCyclesPerICP = (xdrPermyriadPerIcp: bigint): string => {
    const trillionCyclesPerICP = Number(xdrPermyriadPerIcp) / Number(PERMYRIAD_DENOMINATOR);
    return formatNumberWithUnit(1 / trillionCyclesPerICP, ICPToken.symbol, {decimalPlaces: 4, unitSpace: ' '});
};

type AdaptiveStrategy = 'short' | 'long';

const ADAPTIVE_STRATEGIES = {
    short: {
        above0_01T: 2,
        default: 4
    },
    long: {
        above0_01T: 4,
        default: DECIMAL_PLACES
    }
} as const;

export const formatCyclesValueWithUnitByStrategy = (valueWithUnit: ValueWithUnit | undefined, strategy: AdaptiveStrategy): string => {
    const value = valueWithUnit?.value ?? 0;
    const thresholds = ADAPTIVE_STRATEGIES[strategy];
    const decimalPlaces = value > 0.01 ? thresholds.above0_01T : thresholds.default;
    return formatCyclesValueWithUnit(valueWithUnit, {decimalPlaces});
};
