import queryString from 'query-string';
import {useCallback, useMemo} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';

type SerializeFn<T> = (state: Partial<T>, defaultState: T) => Record<string, any>;
type DeserializeFn<T> = (query: Record<string, any>, defaultState: T, prefix: string) => T;

const DEFAULT_PARSE_OPTIONS: queryString.ParseOptions = {
    arrayFormat: 'none'
};

const DEFAULT_STRINGIFY_OPTIONS: queryString.StringifyOptions = {
    skipNull: true,
    skipEmptyString: true
};

export type UrlStateOptions = {
    prefix?: string;
    replace?: boolean;
    baseUrl?: string;
    parseOptions?: queryString.ParseOptions;
    stringifyOptions?: queryString.StringifyOptions;
};

export type UrlStateResult<T> = {
    state: T;
    updateState: (newState: Partial<T>) => void;
    clearState: () => void;
};

export const useUrlState = <T extends Record<string, any>>(initialState: T, serialize: SerializeFn<T>, deserialize: DeserializeFn<T>, options: UrlStateOptions = {}): UrlStateResult<T> => {
    const {prefix = '', replace = false, baseUrl = '', parseOptions = DEFAULT_PARSE_OPTIONS, stringifyOptions = DEFAULT_STRINGIFY_OPTIONS} = options;

    const location = useLocation();
    const navigate = useNavigate();

    const allParams = useMemo(() => {
        return queryString.parse(location.search, parseOptions);
    }, [location.search, parseOptions]);

    const state = useMemo<T>(() => deserialize(allParams, initialState, prefix), [allParams, initialState, prefix, deserialize]);

    const updateState = useCallback(
        (newState: Partial<T>) => {
            const updatedParams = {...allParams};
            const transformedState = serialize ? serialize({...state, ...newState} as T, initialState) : {...state, ...newState};

            Object.entries(transformedState).forEach(([key, value]) => {
                const paramKey = getSerializedParamKey(key, prefix);
                if (value == undefined || value === initialState[key]) {
                    delete updatedParams[paramKey];
                } else {
                    updatedParams[paramKey] = value;
                }
            });

            const sortedQuery = Object.keys(updatedParams)
                .sort()
                .reduce<Record<string, any>>((acc, key) => {
                    acc[key] = updatedParams[key];
                    return acc;
                }, {});

            const newUrl = queryString.stringifyUrl({url: baseUrl || location.pathname, query: sortedQuery}, stringifyOptions);

            navigate(newUrl, {replace});
        },
        [allParams, serialize, state, initialState, baseUrl, location.pathname, stringifyOptions, navigate, replace, prefix]
    );

    const clearState = useCallback(() => {
        updateState(initialState);
    }, [initialState, updateState]);

    return useMemo<UrlStateResult<T>>(
        () => ({
            state,
            updateState,
            clearState
        }),
        [state, updateState, clearState]
    );
};

export const getSerializedParamKey = (key: string, prefix: string) => `${prefix}${key}`;
