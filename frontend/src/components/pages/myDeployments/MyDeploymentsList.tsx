import {List} from 'antd';
import type {PaginationConfig} from 'antd/es/pagination';
import {type DeploymentInformationExt, useMyDeploymentsProviderContext} from 'frontend/src/context/myDeployments/MyDeploymentsProvider';
import {i18} from 'frontend/src/i18';
import {isEmptyArray} from 'frontend/src/utils/core/array/array';
import {useCallback, useMemo} from 'react';
import {AlertActionButton} from '../../widgets/alert/AlertActionButton';
import {ErrorAlertWithAction} from '../../widgets/alert/ErrorAlertWithAction';
import {PanelLoadingComponent} from '../../widgets/PanelLoadingComponent';
import {spinLoading} from '../../widgets/spinUtils';
import {DataEmptyStub} from '../../widgets/stub/DataEmptyStub';
import {MyDeploymentsListItem} from './MyDeploymentsListItem';

export type ItemType = DeploymentInformationExt;

export const MyDeploymentsList = () => {
    const {feature, remoteData, fetchRemoteData, pagination} = useMyDeploymentsProviderContext();
    const {inProgress, loaded} = feature.status;
    const {isError} = feature.error;

    const rowKey = useCallback((record: ItemType) => record.information.deployment_id.toString(), []);

    const componentLoading = useMemo(() => spinLoading(inProgress), [inProgress]);

    if (loaded) {
        if (isError) {
            return <ErrorAlertWithAction message={i18.myDeployments.stub.error} action={<AlertActionButton onClick={fetchRemoteData} loading={inProgress} />} />;
        }
        if (isEmptyArray(remoteData)) {
            return <DataEmptyStub description={i18.myDeployments.stub.empty} />;
        }
        return (
            <List<ItemType>
                rowKey={rowKey}
                dataSource={remoteData}
                pagination={pagination as PaginationConfig}
                loading={componentLoading}
                size="small"
                renderItem={(item, _index) => <MyDeploymentsListItem item={item} />}
                split={true}
            />
        );
    } else {
        return <PanelLoadingComponent message={i18.myDeployments.stub.loading} />;
    }
};
