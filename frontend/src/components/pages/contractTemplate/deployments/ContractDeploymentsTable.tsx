import {fromNullable, isNullish} from '@dfinity/utils';
import {Table, type TableColumnsType, type TablePaginationConfig, type TableProps} from 'antd';
import {RouterPaths} from 'frontend/src/components/pages/skeleton/Router';
import {AlertActionButton} from 'frontend/src/components/widgets/alert/AlertActionButton';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {DateTimeResponsive} from 'frontend/src/components/widgets/DateTimeResponsive';
import {PanelLoadingComponent} from 'frontend/src/components/widgets/PanelLoadingComponent';
import {spinLoading} from 'frontend/src/components/widgets/spinUtils';
import {DataEmptyStub} from 'frontend/src/components/widgets/stub/DataEmptyStub';
import {CopyableUIDComponent} from 'frontend/src/components/widgets/uid/CopyableUIDComponent';
import {useContractDeploymentsProviderContext} from 'frontend/src/context/contractTemplate/ContractDeploymentsProvider';
import {useContractTemplateContextSafe} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import {type ListState} from 'frontend/src/hook/useRemoteListWithUrlState';
import {i18} from 'frontend/src/i18';
import {compactArray, isEmptyArray} from 'frontend/src/utils/core/array/array';
import {extractValidPositiveInteger} from 'frontend/src/utils/core/number/transform';
import {type MouseEvent, useCallback, useMemo} from 'react';
import {useNavigate} from 'react-router';
import type {DeploymentInformation} from 'src/declarations/hub/hub.did';
import {CONTRACT_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED} from './ContractDeploymentsEntryPoint';
import {DeploymentStatusTagComponent} from './DeploymentStatusTagComponent';

type TableItemType = DeploymentInformation;

export const ContractDeploymentsTable = () => {
    const {contractTemplateId} = useContractTemplateContextSafe();
    const navigate = useNavigate();
    const {updateListState, feature, remoteData, fetchRemoteData, initialState, pagination} = useContractDeploymentsProviderContext();
    const {inProgress, loaded} = feature.status;
    const {isError} = feature.error;

    const rowKey = useCallback((record: TableItemType) => record.deployment_id.toString(), []);

    const columns: TableColumnsType<TableItemType> = useMemo(() => {
        return compactArray([
            {
                key: 'canister',
                title: i18.deployments.table.canister,
                render: (record: TableItemType) => {
                    const moduleCanisterId = fromNullable(record.contract_canister)?.toText();
                    if (isNullish(moduleCanisterId)) {
                        return '-';
                    }
                    return <CopyableUIDComponent uid={moduleCanisterId} />;
                },
                className: 'gf-noWrap'
            },
            {
                key: CONTRACT_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED,
                title: i18.deployments.table.created,
                render: (record: TableItemType) => <DateTimeResponsive timeMillis={record.created} />
            },
            {
                key: 'status',
                title: i18.deployments.table.status.columnTitle,
                render: (record: TableItemType) => <DeploymentStatusTagComponent deploymentInformation={record} />
            }
        ]);
    }, []);

    const onRow: TableProps<TableItemType>['onRow'] = useCallback(
        (record: TableItemType) => {
            return {
                style: {cursor: 'pointer'},
                onClick: (event: MouseEvent<HTMLElement>) => {
                    if (event.isDefaultPrevented() || event.isPropagationStopped()) {
                        return;
                    }
                    navigate(RouterPaths.deployment(contractTemplateId.toString(), record.deployment_id.toString()));
                }
            };
        },
        [navigate, contractTemplateId]
    );

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
            return <ErrorAlertWithAction message={i18.deployments.stub.error} action={<AlertActionButton onClick={fetchRemoteData} loading={inProgress} />} />;
        }
        if (isEmptyArray(remoteData)) {
            return <DataEmptyStub description={i18.deployments.stub.empty} />;
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
                scroll={{x: true}}
                onRow={onRow}
            />
        );
    } else {
        return <PanelLoadingComponent message={i18.deployments.stub.loading} />;
    }
};
