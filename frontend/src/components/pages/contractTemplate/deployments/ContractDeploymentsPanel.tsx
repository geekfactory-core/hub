import {Flex} from 'antd';
import {ReloadIconButton} from 'frontend/src/components/widgets/button/ReloadIconButton';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {useContractDeploymentsProviderContext} from 'frontend/src/context/contractTemplate/ContractDeploymentsProvider';
import {useContractTemplateContextSafe} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import {i18} from 'frontend/src/i18';
import {ContractDeploymentsTable} from './ContractDeploymentsTable';
import {Form} from './form/Form';

export const ContractDeploymentsPanel = () => {
    const {
        contractTemplateInformation: {
            definition: {name}
        }
    } = useContractTemplateContextSafe();

    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <Flex justify="space-between">
                    <PanelHeader title={i18.deployments.pageTitle} description={name} />
                    <RefreshButton />
                </Flex>
                <Form />
                <ContractDeploymentsTable />
            </Flex>
        </PanelCard>
    );
};

const RefreshButton = () => {
    const {feature, fetchRemoteData} = useContractDeploymentsProviderContext();
    if (feature.error.isError) {
        return null;
    }
    const {inProgress, loaded} = feature.status;
    const disabled = inProgress || !loaded;
    return <ReloadIconButton onClick={() => fetchRemoteData()} disabled={disabled} loading={inProgress} />;
};
