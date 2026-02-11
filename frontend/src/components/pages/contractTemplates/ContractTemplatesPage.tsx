import {Flex} from 'antd';
import {useContractTemplatesProviderContext} from 'frontend/src/context/contractTemplates/ContractTemplatesProvider';
import {useConfigDataContext} from 'frontend/src/context/hub/config/ConfigDataProvider';
import {i18} from 'frontend/src/i18';
import {useCallback} from 'react';
import {ReloadIconButton} from '../../widgets/button/ReloadIconButton';
import {PanelCard} from '../../widgets/PanelCard';
import {PanelHeader} from '../../widgets/PanelHeader';
import {Form} from './Form';
import {ContractTemplatesList} from './list/ContractTemplatesList';

export const ContractTemplatesPage = () => {
    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <Flex justify="space-between">
                    <PanelHeader title={i18.contractTemplates.pageTitle} />
                    <RefreshButton />
                </Flex>
                <Form />
                <ContractTemplatesList />
            </Flex>
        </PanelCard>
    );
};

const RefreshButton = () => {
    const {fetchHubConfig} = useConfigDataContext();
    const {feature, fetchRemoteData} = useContractTemplatesProviderContext();

    const onClick = useCallback(() => {
        fetchHubConfig();
        fetchRemoteData();
    }, [fetchHubConfig, fetchRemoteData]);

    if (feature.error.isError) {
        return null;
    }

    const {inProgress, loaded} = feature.status;
    const disabled = inProgress || !loaded;
    return <ReloadIconButton onClick={onClick} disabled={disabled} loading={inProgress} />;
};
