import {isNullish} from '@dfinity/utils';

type SIUnit = '' | 'K' | 'M' | 'G' | 'T';

const unitsSI: ReadonlyArray<SIUnit> = ['', 'K', 'M', 'G', 'T'];

type ValueWithNumberUnit = {
    value: number;
    unit: string;
};
export const convertFractionalAdaptiveSI = (value: bigint | undefined, forceUnit?: SIUnit): ValueWithNumberUnit | undefined => {
    if (isNullish(value) || value < 0n) {
        return undefined;
    }

    let numericValue = Number(value);
    let unit: SIUnit;

    if (forceUnit !== undefined) {
        const forcedIndex = unitsSI.indexOf(forceUnit);
        if (forcedIndex === -1) {
            return undefined;
        }

        numericValue /= Math.pow(1000, forcedIndex);
        unit = forceUnit;
    } else {
        let index = 0;
        while (index < unitsSI.length - 1 && numericValue >= 1000) {
            numericValue /= 1000;
            index++;
        }
        unit = unitsSI[index];
    }

    // If value is 0, return empty unit
    if (numericValue === 0) {
        unit = '';
    }

    return {value: numericValue, unit};
};
