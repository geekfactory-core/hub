import {isNullish, nonNullish, toNullable} from '@dfinity/utils';
import type {TablePaginationConfig} from 'antd';
import {useDefaultPaginationConfig} from 'frontend/src/hook/useDefaultPaginationConfig';
import {
    getStateSafeValueFromPredefinedArray,
    useRemoteListWithUrlState,
    type ListSortItem,
    type ListState,
    type RemoteDataProvider,
    type RemoteListWithUrlStateOptions,
    type RemoteListWithUrlStateResult
} from 'frontend/src/hook/useRemoteListWithUrlState';
import {getSerializedParamKey} from 'frontend/src/hook/useUrlState';
import {trimIfDefined} from 'frontend/src/utils/core/string/string';
import {unionToArray} from 'frontend/src/utils/core/typescript/typescriptAddons';
import type {PropsWithChildren} from 'react';
import {createContext, useCallback, useContext, useMemo} from 'react';
import type {ContractTemplateInformation, ContractTemplatesSortingKey, GetContractTemplatesResult, SortingOrder} from 'src/declarations/hub/hub.did';
import {applicationLogger} from '../logger/logger';
import {useContractTemplates, type FetchChunkParameters, type FetchChunkParametersSorting} from './useContractTemplates';

const StateKeys = {
    filter: 'filter',
    state: 'state'
};

const formRules = {
    filterMinLength: 3,
    filterMaxLength: 30
};

export type ContractTemplateStateType = 'all' | 'available';
const allContractTemplateStateTypes = unionToArray<ContractTemplateStateType>()('all', 'available');
export const CONTRACT_TEMPLATE_STATE_DEFAULT_VALUE: ContractTemplateStateType = 'available';

type ContractTemplatesListState = {
    filter?: string;
    state?: ContractTemplateStateType;
} & ListState;

type RemoteDataItemType = ContractTemplateInformation;
type Context = RemoteListWithUrlStateResult<RemoteDataItemType, ContractTemplatesListState> & {
    initialState: ListState;
    pagination: TablePaginationConfig;
};
const Context = createContext<Context | undefined>(undefined);
export const useContractTemplatesProviderContext = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useContractTemplatesProviderContext must be used within a ContractTemplatesProvider');
    }
    return context;
};

type Props = {
    pageSize: number;
    mapTableColumnToContractTemplatesSortingKey: (columnKey: string) => ContractTemplatesSortingKey | undefined;
};

export const ContractTemplatesProvider = (props: PropsWithChildren<Props>) => {
    const {pageSize, mapTableColumnToContractTemplatesSortingKey} = props;

    const defaultPagination = useDefaultPaginationConfig();

    const {fetchChunk: fetchContractsChunk} = useContractTemplates();

    const remoteDataProvider: RemoteDataProvider<RemoteDataItemType, ContractTemplatesListState> = useCallback(
        async (listState: ContractTemplatesListState) => {
            const {currentPage, pageSize, filters, sort, filter, state} = listState;
            const filterSafe = getFilterStateValueSafe(filter);
            const stateSafe = getContractTemplatesStateValueSafe(state);
            const start = (currentPage - 1) * pageSize;
            const defaultSorting: FetchChunkParametersSorting = {
                key: {Registered: null},
                order: {Descending: null}
            };
            const fetchChunkParameters: FetchChunkParameters = {
                count: pageSize,
                start: start,
                filter: listParametersFilterToRestParameterFilter(filters, filterSafe, stateSafe),
                sorting: listParametersSortToRestParameterSorting(sort, mapTableColumnToContractTemplatesSortingKey) ?? defaultSorting
            };
            const result: GetContractTemplatesResult = await fetchContractsChunk(fetchChunkParameters);
            return {
                data: result.contract_templates,
                total: Number(result.total_count)
            };
        },
        [fetchContractsChunk, mapTableColumnToContractTemplatesSortingKey]
    );

    const listInitialState = useMemo<ContractTemplatesListState>(() => {
        return {
            currentPage: 1,
            pageSize,
            filters: undefined,
            sort: undefined,
            state: CONTRACT_TEMPLATE_STATE_DEFAULT_VALUE,
            filter: undefined
        };
    }, [pageSize]);

    const options: RemoteListWithUrlStateOptions<ContractTemplatesListState> = useMemo(() => {
        return {
            initialState: listInitialState,
            serializeStateForAdditionalProperties: (state, _defaultState): Record<string, any> => {
                const filterSafe = getFilterStateValueSafe(state.filter);
                const stateSafe = getContractTemplatesStateValueSafe(state.state);
                return {
                    [StateKeys.filter]: filterSafe,
                    [StateKeys.state]: stateSafe
                };
            },
            deserializeStateForAdditionalProperties: (query, _defaultState, prefix): Partial<ContractTemplatesListState> => {
                const filterValue = query[getSerializedParamKey(StateKeys.filter, prefix)];
                const filterSafe = getFilterStateValueSafe(filterValue);
                const stateValue = query[getSerializedParamKey(StateKeys.state, prefix)];
                const stateSafe = getContractTemplatesStateValueSafe(stateValue);
                return {
                    [StateKeys.filter]: filterSafe,
                    [StateKeys.state]: stateSafe
                };
            }
        };
    }, [listInitialState]);

    const remoteListWithUrlState = useRemoteListWithUrlState<RemoteDataItemType, ContractTemplatesListState>(remoteDataProvider, options, applicationLogger, 'ContractTemplatesProvider');
    const {listState, listTotalSize, feature, updateListState} = remoteListWithUrlState;
    const {inProgress} = feature.status;

    const pagination: TablePaginationConfig = useMemo(() => {
        return {
            ...defaultPagination,
            disabled: inProgress,
            current: listState.currentPage,
            pageSize: listState.pageSize,
            total: listTotalSize,
            onChange: (page: number, pageSize: number) => {
                updateListState({
                    currentPage: page,
                    pageSize
                });
            }
        };
    }, [defaultPagination, inProgress, listState.currentPage, listState.pageSize, listTotalSize, updateListState]);

    const value: Context = useMemo(
        () => ({
            ...remoteListWithUrlState,
            initialState: listInitialState,
            pagination
        }),
        [remoteListWithUrlState, listInitialState, pagination]
    );

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};

const listParametersFilterToRestParameterFilter = (
    _filters: ListState['filters'],
    filterSafe: string | undefined,
    stateSafe: ContractTemplateStateType | undefined
): FetchChunkParameters['filter'] => {
    const {blocked, retired} = mapStateValueToBackendFilter(stateSafe);
    return {
        filter: toNullable(filterSafe),
        blocked: toNullable(blocked),
        retired: toNullable(retired)
    };
};

const listParametersSortToRestParameterSorting = (
    sort: ListState['sort'],
    mapTableColumnToContractTemplatesSortingKey: Props['mapTableColumnToContractTemplatesSortingKey']
): FetchChunkParameters['sorting'] => {
    const sortItem: ListSortItem | undefined = sort?.[0];
    if (sortItem == undefined) {
        return undefined;
    }
    const sortingKey: ContractTemplatesSortingKey | undefined = mapTableColumnToContractTemplatesSortingKey(sortItem.field);
    const sortingOrder: SortingOrder | undefined = sortItem.order == 'ascend' ? {Ascending: null} : sortItem.order == 'descend' ? {Descending: null} : undefined;

    if (sortingKey == undefined || sortingOrder == undefined) {
        return undefined;
    }
    return {
        key: sortingKey,
        order: sortingOrder
    };
};

const mapStateValueToBackendFilter = (stateFilter: ContractTemplateStateType | undefined): {blocked?: boolean; retired?: boolean} => {
    if (nonNullish(stateFilter) && stateFilter === 'all') {
        return {};
    }
    // 'available' = not blocked AND not retired
    return {blocked: false, retired: false};
};

export const getContractTemplatesStateValueSafe = (value: unknown): ContractTemplateStateType | undefined => getStateSafeValueFromPredefinedArray(value, allContractTemplateStateTypes);

const getFilterStateValueSafe = (queryFilterValue: string | undefined): string | undefined => {
    const trimmedValue = trimIfDefined(queryFilterValue);
    if (isNullish(trimmedValue)) {
        return undefined;
    }
    if (trimmedValue.length < formRules.filterMinLength) {
        return undefined;
    }
    return trimmedValue.substring(0, formRules.filterMaxLength);
};
