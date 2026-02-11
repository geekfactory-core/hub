import type {TablePaginationConfig} from 'antd';
import {PAGE_SIZE} from 'frontend/src/constants';
import {useDefaultPaginationConfig} from 'frontend/src/hook/useDefaultPaginationConfig';
import {
    useRemoteListWithUrlState,
    type ListSortItem,
    type ListState,
    type RemoteDataProvider,
    type RemoteListWithUrlStateOptions,
    type RemoteListWithUrlStateResult
} from 'frontend/src/hook/useRemoteListWithUrlState';
import type {PropsWithChildren} from 'react';
import {createContext, useCallback, useContext, useMemo} from 'react';
import type {GetHubEventsResult, HubEventsSortingKey, IdentifiedHubEvent, SortingOrder} from 'src/declarations/hub/hub.did';
import {applicationLogger} from '../../logger/logger';
import {useHubEvents, type FetchChunkParameters, type FetchChunkParametersSorting} from './useHubEvents';

export type RemoteDataItemType = IdentifiedHubEvent;

type Context = RemoteListWithUrlStateResult<RemoteDataItemType> & {
    initialState: ListState;
    pagination: TablePaginationConfig;
};
const Context = createContext<Context | undefined>(undefined);
export const useHubEventsProviderContext = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useHubEventsProviderContext must be used within a HubEventsProvider');
    }
    return context;
};

type Props = {
    mapTableColumnToHubEventsSortingKey: (columnKey: string) => HubEventsSortingKey | undefined;
};

export const HubEventsProvider = (props: PropsWithChildren<Props>) => {
    const {mapTableColumnToHubEventsSortingKey} = props;

    const defaultPagination = useDefaultPaginationConfig();

    const {fetchChunk: fetchHubEventsChunk} = useHubEvents();

    const remoteDataProvider: RemoteDataProvider<RemoteDataItemType> = useCallback(
        async (listState: ListState) => {
            const {currentPage, pageSize, sort} = listState;
            const start = (currentPage - 1) * pageSize;
            const defaultSorting: FetchChunkParametersSorting = {
                key: {EventId: null},
                order: {Descending: null}
            };
            const fetchChunkParameters: FetchChunkParameters = {
                count: pageSize,
                start: start,
                sorting: listParametersSortToRestParameterSorting(sort, mapTableColumnToHubEventsSortingKey) ?? defaultSorting
            };
            const result: GetHubEventsResult = await fetchHubEventsChunk(fetchChunkParameters);
            return {
                data: result.events,
                total: Number(result.total_count)
            };
        },
        [mapTableColumnToHubEventsSortingKey, fetchHubEventsChunk]
    );

    const initialState: ListState = useMemo(() => {
        return {
            currentPage: 1,
            pageSize: PAGE_SIZE.hubEvents,
            filters: undefined,
            sort: undefined
        };
    }, []);

    const listOptions: RemoteListWithUrlStateOptions = useMemo(() => {
        return {
            initialState,
            queryParametersPrefix: 'hubEvents.'
        };
    }, [initialState]);

    const remoteListWithUrlState = useRemoteListWithUrlState<RemoteDataItemType>(remoteDataProvider, listOptions, applicationLogger, 'HubEventsProvider');
    const {listState, listTotalSize} = remoteListWithUrlState;

    const pagination: TablePaginationConfig = useMemo(() => {
        return {
            ...defaultPagination,
            current: listState.currentPage,
            pageSize: listState.pageSize,
            total: listTotalSize
        };
    }, [defaultPagination, listState.currentPage, listState.pageSize, listTotalSize]);

    const value: Context = useMemo(
        () => ({
            ...remoteListWithUrlState,
            initialState,
            pagination
        }),
        [remoteListWithUrlState, initialState, pagination]
    );

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};

const listParametersSortToRestParameterSorting = (sort: ListState['sort'], mapTableColumnToHubEventsSortingKey: Props['mapTableColumnToHubEventsSortingKey']): FetchChunkParameters['sorting'] => {
    const sortItem: ListSortItem | undefined = sort?.[0];
    if (sortItem == undefined) {
        return undefined;
    }
    const sortingKey: HubEventsSortingKey | undefined = mapTableColumnToHubEventsSortingKey(sortItem.field);
    const sortingOrder: SortingOrder | undefined = sortItem.order == 'ascend' ? {Ascending: null} : sortItem.order == 'descend' ? {Descending: null} : undefined;

    if (sortingKey == undefined || sortingOrder == undefined) {
        return undefined;
    }
    return {
        key: sortingKey,
        order: sortingOrder
    };
};
