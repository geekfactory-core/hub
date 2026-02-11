import {Table, type TableColumnsType, type TablePaginationConfig, type TableProps} from 'antd';
import {AlertActionButton} from 'frontend/src/components/widgets/alert/AlertActionButton';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {DateTimeResponsive} from 'frontend/src/components/widgets/DateTimeResponsive';
import {PanelLoadingComponent} from 'frontend/src/components/widgets/PanelLoadingComponent';
import {spinLoading} from 'frontend/src/components/widgets/spinUtils';
import {DataEmptyStub} from 'frontend/src/components/widgets/stub/DataEmptyStub';
import {type RemoteDataItemType, useHubEventsProviderContext} from 'frontend/src/context/hub/events/HubEventsProvider';
import {type ListState} from 'frontend/src/hook/useRemoteListWithUrlState';
import {i18} from 'frontend/src/i18';
import {compactArray, isEmptyArray} from 'frontend/src/utils/core/array/array';
import {formatDateTime} from 'frontend/src/utils/core/date/format';
import {extractValidPositiveInteger} from 'frontend/src/utils/core/number/transform';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {useCallback, useMemo} from 'react';
import {DebugPopupWithData} from '../../../widgets/DebugPopupWithData';
import {HUB_EVENTS_TABLE_COLUMN_KEY__CREATED} from './HubEventsPanel';

type TableItemType = RemoteDataItemType;

export const HubEventsTable = () => {
    const {updateListState, feature, remoteData, fetchRemoteData, initialState, pagination} = useHubEventsProviderContext();
    const {inProgress, loaded} = feature.status;
    const {isError} = feature.error;

    const rowKey = useCallback((record: TableItemType) => record.id.toString(), []);

    const columns: TableColumnsType<TableItemType> = useMemo(() => {
        const array: TableColumnsType<TableItemType> = [
            {
                key: 'event',
                title: i18.status.hubEvents.table.event,
                render: (record: TableItemType) => {
                    return getICFirstKey(record.event.event) ?? i18.status.hubEvents.table.stub.unknownEvent;
                }
            },
            {
                key: HUB_EVENTS_TABLE_COLUMN_KEY__CREATED,
                title: i18.status.hubEvents.table.created,
                render: (record: TableItemType) => <DateTimeResponsive timeMillis={record.event.time} forceBreakLines />
            },
            {
                key: 'debug',
                render: (record: TableItemType) => {
                    return <DebugPopupWithData title={`Event Time: ${formatDateTime(Number(record.event.time))}`} data={record} placement="left" />;
                },
                width: '1%'
            }
        ];
        return compactArray(array);
    }, []);

    const handleTableChange: TableProps<TableItemType>['onChange'] = useCallback(
        (pagination: TablePaginationConfig) => {
            const currentPage = extractValidPositiveInteger(`${pagination.current}`) ?? initialState.currentPage;
            const pageSize = extractValidPositiveInteger(`${pagination.pageSize}`) ?? initialState.pageSize;

            const newParams: ListState = {
                currentPage,
                pageSize
            };
            updateListState(newParams);
        },
        [initialState.currentPage, initialState.pageSize, updateListState]
    );

    const componentLoading = useMemo(() => spinLoading(inProgress), [inProgress]);

    if (loaded) {
        if (isError) {
            return <ErrorAlertWithAction message={i18.status.hubEvents.stub.error} action={<AlertActionButton onClick={fetchRemoteData} loading={inProgress} />} />;
        }
        if (isEmptyArray(remoteData)) {
            return <DataEmptyStub description={i18.status.hubEvents.stub.empty} />;
        }
        return (
            <Table<TableItemType>
                columns={columns}
                rowKey={rowKey}
                dataSource={remoteData}
                pagination={pagination}
                loading={componentLoading}
                onChange={handleTableChange}
                showSorterTooltip={false}
                size="small"
                scroll={{x: 350}}
            />
        );
    } else {
        return <PanelLoadingComponent message={i18.status.hubEvents.stub.loading} />;
    }
};
