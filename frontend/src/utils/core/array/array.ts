import {isNullish, nonNullish} from '@dfinity/utils';

export const compactArray = <T>(array: Array<T | null | undefined>): Array<T> => {
    return array.filter(nonNullish);
};

export function isEmptyArray<T>(array: Array<T | null | undefined> | null | undefined): array is null | undefined | [] {
    return isNullish(array) || array.length == 0;
}
