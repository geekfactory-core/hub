import {isNullish} from '@dfinity/utils';

export type KeysOfUnion<T> = T extends T ? keyof T : never;

export function hasProperty<T extends object, K extends KeysOfUnion<T>>(obj: T, prop: K): obj is Extract<T, Record<K, unknown>> {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

export type Record_Partial<F> = {[P in keyof F]?: Partial<F[P]>};

export type WithoutUndefined<T, Keys extends keyof T = keyof T> = {
    [K in keyof T]: K extends Keys ? NonNullable<T[K]> : T[K];
};

type NonEmptyArray<T> = [T, ...Array<T>];
type ValueTypeUnion<T> = T[keyof T];
type MustInclude<T, U extends Array<T>> = [T] extends [ValueTypeUnion<U>] ? U : never;
export function unionToArray<T>() {
    return <U extends NonEmptyArray<T>>(...elements: MustInclude<T, U>) => elements;
}

export type TransformUnion<T> = T extends infer U ? (U extends Record<string, unknown> ? {type: keyof U; state: U[keyof U]} : never) : never;

export function getSingleEntryUnion<T extends object>(unionState: T | undefined): TransformUnion<T> | undefined {
    if (isNullish(unionState)) {
        return undefined;
    }

    const entry = Object.entries(unionState).find(([key]) => hasProperty(unionState, key as KeysOfUnion<T>));

    if (isNullish(entry)) {
        return undefined;
    }

    const [type, state] = entry as [KeysOfUnion<T>, T[KeysOfUnion<T>]];

    return {type, state} as TransformUnion<T>;
}
