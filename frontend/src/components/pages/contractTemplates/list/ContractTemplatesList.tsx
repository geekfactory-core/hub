import {List} from 'antd';
import type {PaginationConfig} from 'antd/es/pagination/index';
import {AlertActionButton} from 'frontend/src/components/widgets/alert/AlertActionButton';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {PanelLoadingComponent} from 'frontend/src/components/widgets/PanelLoadingComponent';
import {spinLoading} from 'frontend/src/components/widgets/spinUtils';
import {DataEmptyStub} from 'frontend/src/components/widgets/stub/DataEmptyStub';
import {useContractTemplatesProviderContext} from 'frontend/src/context/contractTemplates/ContractTemplatesProvider';
import {i18} from 'frontend/src/i18';
import {isEmptyArray} from 'frontend/src/utils/core/array/array';
import {useCallback, useMemo} from 'react';
import type {ContractTemplateInformation} from 'src/declarations/hub/hub.did';
import {ContractTemplatesListItem} from './ContractTemplatesListItem';

export type ItemType = ContractTemplateInformation;

type Props = {
    noPagination?: boolean;
};
export const ContractTemplatesList = (props: Props) => {
    const {noPagination} = props;
    const {feature, remoteData, pagination, fetchRemoteData} = useContractTemplatesProviderContext();
    const {inProgress, loaded} = feature.status;
    const {isError} = feature.error;

    const rowKey = useCallback((record: ItemType) => record.contract_template_id.toString(), []);

    const componentLoading = useMemo(() => spinLoading(inProgress), [inProgress]);

    if (loaded) {
        if (isError) {
            return <ErrorAlertWithAction message={i18.contractTemplates.stub.error} action={<AlertActionButton onClick={fetchRemoteData} loading={inProgress} />} />;
        }
        if (isEmptyArray(remoteData)) {
            return <DataEmptyStub description={i18.contractTemplates.stub.empty} />;
        }
        return (
            <List<ItemType>
                rowKey={rowKey}
                dataSource={remoteData}
                pagination={noPagination ? false : (pagination as PaginationConfig)}
                loading={componentLoading}
                size="small"
                renderItem={(item, _index) => (
                    <List.Item>
                        <ContractTemplatesListItem item={item} />
                    </List.Item>
                )}
                split={false}
            />
        );
    } else {
        return <PanelLoadingComponent message={i18.contractTemplates.stub.loading} />;
    }
};
