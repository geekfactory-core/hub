import {isNullish, nonNullish} from '@dfinity/utils';
import {getSerializedParamKey, useUrlState, type UrlStateOptions, type UrlStateResult} from 'frontend/src/hook/useUrlState';
import {toError} from 'frontend/src/utils/core/error/toError';
import {useFeature, type Feature} from 'frontend/src/utils/core/feature/feature';
import {extractValidPositiveInteger} from 'frontend/src/utils/core/number/transform';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {isNonEmptyString, trimIfDefined} from 'frontend/src/utils/core/string/string';
import type {Logger} from 'frontend/src/utils/logger/Logger';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {caughtErrorMessage} from '../context/logger/loggerConstants';

const DEFAULT_CURRENT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

type ListSortOrder = 'ascend' | 'descend';
type ListFilterValue = Array<string>;

/**
 * Types for table parameters
 */
export type ListSortItem = {field: string; order: ListSortOrder};
export type ListState = {
    currentPage: number;
    pageSize: number;
    filters?: Record<string, ListFilterValue>;
    sort?: Array<ListSortItem>;
};

const defaultInitialState: ListState = {
    currentPage: DEFAULT_CURRENT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    filters: undefined,
    sort: undefined
};

/**
 * Hook options
 */
export interface RemoteListWithUrlStateOptions<ExtendedListState extends ListState = ListState> {
    initialState?: ExtendedListState;
    queryParametersPrefix?: string;
    serializeStateForAdditionalProperties?: (state: Partial<ExtendedListState>, defaultState: ExtendedListState) => Record<string, any>;
    deserializeStateForAdditionalProperties?: (query: Record<string, any>, defaultState: ExtendedListState, prefix: string) => Record<string, any>;
}

/**
 * Result from the hook
 */
export interface RemoteListWithUrlStateResult<RemoteDataItemType, ExtendedListState extends ListState = ListState> {
    listState: ExtendedListState;
    initialListState: ExtendedListState;
    updateListState: (newState: Partial<ExtendedListState>) => void;
    clearListState: UrlStateResult<ExtendedListState>['clearState'];

    feature: Feature;
    remoteData: Array<RemoteDataItemType> | undefined;
    listTotalSize: number | undefined;

    fetchRemoteData: () => Promise<void>;
}

export type RemoteDataProvider<RemoteDataItemType, ExtendedListState extends ListState = ListState> = (
    params: ExtendedListState
) => Promise<{data: Array<RemoteDataItemType>; total: number} | undefined>;

/**
 * Hook implementation
 */
export const useRemoteListWithUrlState = <RemoteDataItemType, ExtendedListState extends ListState = ListState>(
    remoteDataProvider: RemoteDataProvider<RemoteDataItemType, ExtendedListState>,
    options: RemoteListWithUrlStateOptions<ExtendedListState> = {},
    logger: Logger,
    ctx: string = ''
): RemoteListWithUrlStateResult<RemoteDataItemType, ExtendedListState> & {listState: ExtendedListState} => {
    const {initialState, queryParametersPrefix, serializeStateForAdditionalProperties, deserializeStateForAdditionalProperties} = options;

    const targetInitialState: ExtendedListState = useMemo(() => initialState ?? (defaultInitialState as ExtendedListState), [initialState]);

    const urlStateOptions: UrlStateOptions = useMemo(() => {
        return {
            prefix: queryParametersPrefix
        };
    }, [queryParametersPrefix]);

    const serializeStateWithAdditionalProperties = useCallback(
        (state: Partial<ExtendedListState>, defaultState: ExtendedListState) => {
            return serializeState(state, defaultState, serializeStateForAdditionalProperties);
        },
        [serializeStateForAdditionalProperties]
    );

    const deserializeStateWithAdditionalProperties = useCallback(
        (query: Record<string, any>, defaultState: ExtendedListState, prefix: string) => {
            return deserializeState(query, defaultState, prefix, deserializeStateForAdditionalProperties);
        },
        [deserializeStateForAdditionalProperties]
    );

    const {
        state: listState,
        updateState: updateListState,
        clearState: clearListState
    } = useUrlState<ExtendedListState>(targetInitialState, serializeStateWithAdditionalProperties, deserializeStateWithAdditionalProperties, urlStateOptions);

    const [remoteData, setRemoteData] = useState<Array<RemoteDataItemType> | undefined>(undefined);
    const [listTotalSize, setListTotalSize] = useState<number | undefined>(undefined);
    const [feature, updateFeature] = useFeature();

    const fetchRemoteData = useMemo(
        () =>
            reusePromiseWrapper(async () => {
                try {
                    updateFeature({status: {inProgress: true}});
                    const result = await remoteDataProvider(listState);
                    setRemoteData(result?.data);
                    setListTotalSize(result?.total);
                    updateFeature({
                        status: {inProgress: false, loaded: true},
                        error: {isError: false, error: undefined}
                    });
                } catch (e) {
                    logger.error(caughtErrorMessage(`useRemoteListWithUrlState.fetchRemoteData[${ctx}]:`), e);
                    updateFeature({
                        status: {inProgress: false, loaded: true},
                        error: {isError: true, error: toError(e)}
                    });
                }
            }),
        [updateFeature, remoteDataProvider, listState, logger, ctx]
    );

    useEffect(() => {
        fetchRemoteData();
    }, [fetchRemoteData]);

    return {
        listState,
        initialListState: targetInitialState,
        updateListState,
        clearListState,

        feature,
        remoteData,
        listTotalSize,

        fetchRemoteData
    };
};

const escape = encodeURIComponent;
const unescape = decodeURIComponent;

const serializeState = <ExtendedListState extends ListState = ListState>(
    state: Partial<ExtendedListState>,
    defaultState: ExtendedListState,
    serializeStateForAdditionalProperties?: (state: Partial<ExtendedListState>, defaultState: ExtendedListState) => Record<string, any>
): Record<string, any> => {
    const sort = state.sort?.length && JSON.stringify(state.sort) !== JSON.stringify(defaultState.sort) ? state.sort.map((s) => serializeListSortItem(s)).join(',') : undefined;

    let filters: string | undefined;
    if (state.filters) {
        const hasFilters = Object.keys(state.filters).length > 0;
        if (hasFilters) {
            const normalizedStateFilters = normalizeFilters(state.filters);
            const normalizedDefaultFilters = normalizeFilters(defaultState.filters);
            const isDifferentFromDefault = JSON.stringify(normalizedStateFilters) !== JSON.stringify(normalizedDefaultFilters);
            if (isDifferentFromDefault) {
                filters = Object.entries(state.filters)
                    .map(([key, values]) => serializeListFilterItem(key, values))
                    .join(';');
            }
        }
    }

    const currentPage = state.currentPage != undefined && state.currentPage !== defaultState.currentPage ? state.currentPage : undefined;

    const pageSize = state.pageSize != undefined && state.pageSize !== defaultState.pageSize && state.pageSize <= MAX_PAGE_SIZE ? state.pageSize : undefined;

    const additionalProperties = serializeStateForAdditionalProperties ? serializeStateForAdditionalProperties(state, defaultState) : {};

    return {
        ...additionalProperties,
        ...{sort},
        ...{filters},
        ...{currentPage},
        ...{pageSize}
    };
};

export const serializeListSortItem = (item: ListSortItem): string => {
    return item.order == 'descend' ? `-${item.field}` : item.field;
};

const serializeListFilterItem = (key: string, values: Array<string>) => `${escape(key)}:${values.map(escape).join(',')}`;

const deserializeState = <ExtendedListState extends ListState = ListState>(
    query: Record<string, any>,
    defaultState: ExtendedListState,
    prefix: string,
    deserializeStateForAdditionalProperties?: (query: Record<string, any>, defaultState: ExtendedListState, prefix: string) => Record<string, any>
): ExtendedListState => {
    const sortValue = query[getSerializedParamKey('sort', prefix)];
    const sort: Array<ListSortItem> | undefined = deserializeListSortItem(sortValue, defaultState.sort);

    const filtersValue = query[getSerializedParamKey('filters', prefix)];
    const filters =
        typeof filtersValue === 'string'
            ? filtersValue.split(';').reduce(
                  (acc, pair) => {
                      const deserializedPair = deserializeListFilterItem(pair);
                      if (nonNullish(deserializedPair)) {
                          acc[deserializedPair.key] = deserializedPair.values;
                      }
                      return acc;
                  },
                  {} as Record<string, Array<string>>
              )
            : Object.keys(defaultState.filters ?? {}).length
              ? defaultState.filters
              : undefined;
    const currentPageValue = query[getSerializedParamKey('currentPage', prefix)];
    const currentPage = extractValidPositiveInteger(currentPageValue) ?? defaultState.currentPage;
    const pageSizeValue = query[getSerializedParamKey('pageSize', prefix)];
    let pageSize = extractValidPositiveInteger(pageSizeValue) ?? defaultState.pageSize;
    if (pageSize > MAX_PAGE_SIZE) {
        pageSize = defaultState.pageSize;
    }

    const additionalProperties = deserializeStateForAdditionalProperties ? deserializeStateForAdditionalProperties(query, defaultState, prefix) : {};
    return {
        ...additionalProperties,
        sort: sort,
        filters: filters,
        currentPage,
        pageSize
    } as ExtendedListState;
};

export const deserializeListSortItem = (sortValue: any, defaultSortItems?: Array<ListSortItem>): Array<ListSortItem> | undefined => {
    return typeof sortValue === 'string'
        ? sortValue.split(',').map((item) => (item.startsWith('-') ? {field: unescape(item.slice(1)), order: 'descend'} : {field: unescape(item), order: 'ascend'}))
        : defaultSortItems?.length
          ? defaultSortItems
          : undefined;
};

const deserializeListFilterItem = (filterValue: any): {key: string; values: Array<string>} | undefined => {
    if (isNonEmptyString(filterValue)) {
        const [key, values] = filterValue.split(':');
        if (key && values) {
            return {key: unescape(key), values: values.split(',').map(unescape)};
        }
    }
    return undefined;
};

/**
 * Normalizes the provided filters by removing entries with empty values and returning only those
 * with non-empty values. If the input is undefined or all entries are empty, the function returns undefined.
 *
 * @param {Record<string, ListFilterValue>} [filters] - The filters to normalize, represented as a record
 * where the key is a string and the value is of type ListFilterValue.
 * @returns {Record<string, ListFilterValue> | undefined} - The normalized filters excluding entries
 * with empty values, or undefined if no valid filters exist.
 */
const normalizeFilters = (filters?: Record<string, ListFilterValue>): Record<string, ListFilterValue> | undefined => {
    if (isNullish(filters)) {
        return undefined;
    }

    const normalizedFilters: Record<string, ListFilterValue> = {};
    Object.entries(filters).forEach(([key, value]) => {
        if (value.length > 0) {
            normalizedFilters[key] = value;
        }
    });

    return Object.keys(normalizedFilters).length > 0 ? normalizedFilters : undefined;
};

export const getStateSafeValueFromPredefinedArray = <T,>(value_: unknown, validValues: Array<T>): T | undefined => {
    const value = trimIfDefined(value_);
    if (isNullish(value)) {
        return undefined;
    }
    const isValidValue = validValues.includes(value as T);
    if (isValidValue) {
        return value as T;
    }
    return undefined;
};
