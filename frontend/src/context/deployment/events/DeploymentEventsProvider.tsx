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
import type {DeploymentEventsSortingKey, DeploymentProcessingIdentifiedEvent, GetDeploymentEventsResult, SortingOrder} from 'src/declarations/hub/hub.did';
import {applicationLogger} from '../../logger/logger';
import {useDeploymentEvents, type FetchChunkParameters, type FetchChunkParametersSorting} from './useDeploymentEvents';

type RemoteDataItemType = DeploymentProcessingIdentifiedEvent;
type Context = RemoteListWithUrlStateResult<RemoteDataItemType> & {
    initialState: ListState;
    pagination: TablePaginationConfig;
};
const Context = createContext<Context | undefined>(undefined);
export const useDeploymentEventsProviderContext = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useDeploymentEventsProviderContext must be used within a DeploymentEventsProvider');
    }
    return context;
};

type Props = {
    deploymentId: bigint;
    mapTableColumnToDeploymentEventsSortingKey: (columnKey: string) => DeploymentEventsSortingKey | undefined;
};

export const DeploymentEventsProvider = (props: PropsWithChildren<Props>) => {
    const {deploymentId, mapTableColumnToDeploymentEventsSortingKey} = props;

    const defaultPagination = useDefaultPaginationConfig();

    const {fetchChunk: fetchDeploymentEventsChunk} = useDeploymentEvents(deploymentId);

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
                sorting: listParametersSortToRestParameterSorting(sort, mapTableColumnToDeploymentEventsSortingKey) ?? defaultSorting
            };
            const result: GetDeploymentEventsResult = await fetchDeploymentEventsChunk(fetchChunkParameters);
            return {
                data: result.events,
                total: Number(result.total_count)
            };
        },
        [mapTableColumnToDeploymentEventsSortingKey, fetchDeploymentEventsChunk]
    );

    const initialState: ListState = useMemo(() => {
        return {
            currentPage: 1,
            pageSize: PAGE_SIZE.deploymentEvents,
            filters: undefined,
            sort: undefined
        };
    }, []);

    const listOptions: RemoteListWithUrlStateOptions = useMemo(() => {
        return {
            initialState
        };
    }, [initialState]);

    const remoteListWithUrlState = useRemoteListWithUrlState<RemoteDataItemType>(remoteDataProvider, listOptions, applicationLogger, 'DeploymentEventsProvider');
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

const listParametersSortToRestParameterSorting = (
    sort: ListState['sort'],
    mapTableColumnToDeploymentEventsSortingKey: Props['mapTableColumnToDeploymentEventsSortingKey']
): FetchChunkParameters['sorting'] => {
    const sortItem: ListSortItem | undefined = sort?.[0];
    if (sortItem == undefined) {
        return undefined;
    }
    const sortingKey: DeploymentEventsSortingKey | undefined = mapTableColumnToDeploymentEventsSortingKey(sortItem.field);
    const sortingOrder: SortingOrder | undefined = sortItem.order == 'ascend' ? {Ascending: null} : sortItem.order == 'descend' ? {Descending: null} : undefined;

    if (sortingKey == undefined || sortingOrder == undefined) {
        return undefined;
    }
    return {
        key: sortingKey,
        order: sortingOrder
    };
};
