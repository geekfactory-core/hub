import {Table, type TableColumnsType} from 'antd';
import type {PaginationConfig} from 'antd/es/pagination';
import {AlertActionButton} from 'frontend/src/components/widgets/alert/AlertActionButton';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {DateTimeResponsive} from 'frontend/src/components/widgets/DateTimeResponsive';
import {PanelLoadingComponent} from 'frontend/src/components/widgets/PanelLoadingComponent';
import {spinLoading} from 'frontend/src/components/widgets/spinUtils';
import {DataEmptyStub} from 'frontend/src/components/widgets/stub/DataEmptyStub';
import {PAGE_SIZE} from 'frontend/src/constants';
import {useLoggerEventsProviderContext} from 'frontend/src/context/logger/LoggerEventsProvider';
import {useDefaultPaginationConfig} from 'frontend/src/hook/useDefaultPaginationConfig';
import {i18} from 'frontend/src/i18';
import {compactArray, isEmptyArray} from 'frontend/src/utils/core/array/array';
import type {LogEntry} from 'frontend/src/utils/logger/Logger';
import {useCallback, useMemo} from 'react';
import {DebugPopupWithData} from '../../../widgets/DebugPopupWithData';

type TableItemType = LogEntry;

const paginationConfig: PaginationConfig = {
    defaultPageSize: PAGE_SIZE.browserEvents
};

export const LoggerEventsTable = () => {
    const {loggerEvents, feature, fetchLoggerEvents} = useLoggerEventsProviderContext();
    const {inProgress, loaded} = feature.status;
    const {isError} = feature.error;

    const pagination = useDefaultPaginationConfig(paginationConfig);

    const rowKey = useCallback((record: TableItemType) => record.uid.toString(), []);

    const columns: TableColumnsType<TableItemType> = useMemo(() => {
        const array: TableColumnsType<TableItemType> = [
            {
                key: 'message',
                title: i18.status.loggerEvents.table.message,
                render: (record: TableItemType) => record.message
            },
            {
                key: 'created',
                title: i18.status.loggerEvents.table.created,
                render: (record: TableItemType) => <DateTimeResponsive timeMillis={record.timestampMillis} forceBreakLines />,
                sorter: (a, b, _sortOrder) => a.timestampMillis - b.timestampMillis,
                className: 'gf-noWrap'
            },
            {
                key: 'level',
                title: i18.status.loggerEvents.table.level,
                render: (record: TableItemType) => record.level,
                className: 'gf-noWrap'
            },
            {
                key: 'prefix',
                title: 'Prefix',
                render: (record: TableItemType) => record.prefix,
                className: 'gf-noWrap'
            },

            {
                key: 'uid',
                title: 'UID',
                render: (record: TableItemType) => record.uid,
                className: 'gf-noWrap'
            },
            {
                key: 'debug',
                render: (record: TableItemType) => {
                    return <DebugPopupWithData title={`Event ID: ${record.uid}`} data={record} placement="left" />;
                },
                width: '1%'
            }
        ];
        return compactArray(array);
    }, []);

    const componentLoading = useMemo(() => spinLoading(inProgress), [inProgress]);

    if (loaded) {
        if (isError) {
            return <ErrorAlertWithAction message={i18.status.loggerEvents.stub.error} action={<AlertActionButton onClick={fetchLoggerEvents} loading={inProgress} />} />;
        }
        if (isEmptyArray(loggerEvents)) {
            return <DataEmptyStub description={i18.status.loggerEvents.stub.empty} />;
        }
        return (
            <Table<TableItemType>
                columns={columns}
                rowKey={rowKey}
                dataSource={loggerEvents}
                pagination={pagination}
                loading={componentLoading}
                showSorterTooltip={false}
                size="small"
                scroll={{x: 600}}
            />
        );
    } else {
        return <PanelLoadingComponent message={i18.status.loggerEvents.stub.loading} />;
    }
};
