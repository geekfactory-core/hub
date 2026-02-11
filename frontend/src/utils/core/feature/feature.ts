import {useReducer, type Reducer} from 'react';
import type {Record_Partial} from '../typescript/typescriptAddons';

/**
==========================================
FStatus
==========================================
*/

type FStatus = {
    inProgress: boolean;
    loaded: boolean;
};
const defaultFStatus: FStatus = {inProgress: false, loaded: false};

/**
==========================================
FError
==========================================
*/

type FError = {
    isError: boolean;
    error?: Error;
};
const defaultFError: FError = {isError: false, error: undefined};

/**
==========================================
Feature
==========================================
*/

export type Feature = {
    status: FStatus;
    error: FError;
};

export type FeaturePartial = Record_Partial<Feature>;

function getDefaultFeature(): Feature {
    return {
        status: {...defaultFStatus},
        error: {...defaultFError}
    };
}
export const useFError = () => useSimpleReducer<FError, Record_Partial<FError>>(defaultFError);
export const useFeature = () => useReducer<Reducer<Feature, FeaturePartial>, void>(simpleFeatureReducer, undefined, () => getDefaultFeature());

export type DataAvailability<TAvailable extends Record<string, any> | never = never, TNotAvailable extends Record<string, any> | never = never, TLoading extends Record<string, any> | never = never> =
    | ([TAvailable] extends [never] ? {type: 'available'} : {type: 'available'} & TAvailable)
    | ([TNotAvailable] extends [never] ? {type: 'notAvailable'} : {type: 'notAvailable'} & TNotAvailable)
    | ([TLoading] extends [never] ? {type: 'loading'} : {type: 'loading'} & TLoading);

/**
==========================================
Reducer
==========================================
*/

export function useSimpleReducer<T extends object, TP extends object>(initialState?: T | (() => T)) {
    return useReducer<Reducer<T, TP>, void>(simpleReducer, undefined, () => (typeof initialState === 'function' ? initialState() : {...initialState}) as T);
}

function simpleReducer(state: any, newState: any) {
    return {...state, ...newState};
}

function simpleFeatureReducer(state: any, newState: any) {
    if (newState == undefined) {
        return {};
    }
    const result = {...state};
    Object.entries(newState).forEach(([key, value]) => {
        if (value == undefined) {
            result[key] = undefined;
        } else {
            result[key] = {
                ...result[key],
                ...value
            };
        }
    });
    return result;
}
