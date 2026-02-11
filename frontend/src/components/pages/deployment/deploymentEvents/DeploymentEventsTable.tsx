import type {TableColumnsType, TablePaginationConfig, TableProps} from 'antd';
import {Table} from 'antd';
import {AlertActionButton} from 'frontend/src/components/widgets/alert/AlertActionButton';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {DateTimeResponsive} from 'frontend/src/components/widgets/DateTimeResponsive';
import {PanelLoadingComponent} from 'frontend/src/components/widgets/PanelLoadingComponent';
import {spinLoading} from 'frontend/src/components/widgets/spinUtils';
import {DataEmptyStub} from 'frontend/src/components/widgets/stub/DataEmptyStub';
import {useDeploymentEventsProviderContext} from 'frontend/src/context/deployment/events/DeploymentEventsProvider';
import {type ListState} from 'frontend/src/hook/useRemoteListWithUrlState';
import {i18} from 'frontend/src/i18';
import {compactArray, isEmptyArray} from 'frontend/src/utils/core/array/array';
import {extractValidPositiveInteger} from 'frontend/src/utils/core/number/transform';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {useCallback, useMemo} from 'react';
import type {DeploymentProcessingIdentifiedEvent} from 'src/declarations/hub/hub.did';
import {DebugPopupWithData} from '../../../widgets/DebugPopupWithData';
import {DEPLOYMENT_EVENTS_TABLE_COLUMN_KEY__CREATED} from './DeploymentEventsPage';

type TableItemType = DeploymentProcessingIdentifiedEvent;

export const DeploymentEventsTable = () => {
    const {updateListState, feature, remoteData, fetchRemoteData, initialState, pagination} = useDeploymentEventsProviderContext();
    const {inProgress, loaded} = feature.status;
    const {isError} = feature.error;

    const rowKey = useCallback((record: TableItemType) => record.id, []);

    const columns: TableColumnsType<TableItemType> = useMemo(() => {
        return compactArray([
            {
                key: 'event',
                title: i18.deploymentEvents.table.event,
                render: (record: TableItemType) => {
                    return getICFirstKey(record.event) ?? '-';
                }
            },
            {
                key: DEPLOYMENT_EVENTS_TABLE_COLUMN_KEY__CREATED,
                title: i18.deploymentEvents.table.created,
                render: (record: TableItemType) => <DateTimeResponsive timeMillis={record.time} forceBreakLines />
            },
            {
                key: 'debug',
                render: (record: TableItemType) => {
                    return <DebugPopupWithData title={`Event ID: ${record.id.toString()}`} data={record} placement="left" />;
                },
                width: '1%'
            }
        ]);
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
            return <ErrorAlertWithAction message={i18.deploymentEvents.stub.error} action={<AlertActionButton onClick={fetchRemoteData} loading={inProgress} />} />;
        }
        if (isEmptyArray(remoteData)) {
            return <DataEmptyStub description={i18.deploymentEvents.stub.empty} />;
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
                scroll={{x: 400}}
            />
        );
    } else {
        return <PanelLoadingComponent message={i18.deploymentEvents.stub.loading} />;
    }
};
