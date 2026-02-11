import type {KeysOfUnion} from '../core/typescript/typescriptAddons';

export type ExtractResponseOk<T> = T extends {Ok: infer O} ? O : never;
export type ExtractResponseError<T> = T extends {Err: infer E} ? E : never;

export type ExtractOptional<T> = T extends [] ? undefined : T extends [infer U] ? U : undefined;

export const getICFirstKey = <T>(obj: T): KeysOfUnion<T> | undefined => {
    return Object.keys(obj || {})[0] as KeysOfUnion<T>;
};
