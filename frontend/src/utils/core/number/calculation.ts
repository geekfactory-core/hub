/**
 * Sum an array of bigints, returning the sum if all numbers are defined, or undefined otherwise.
 * @param values
 */
export const sumOfBigintsIfAllDefined = (...values: Array<bigint | undefined>): bigint | undefined => {
    if (values.length == 0) {
        return undefined;
    }
    const allAreDefined = values.every((value): value is bigint => value != undefined);
    if (!allAreDefined) {
        return undefined;
    }
    return values.reduce((acc, value) => acc + value, 0n);
};
