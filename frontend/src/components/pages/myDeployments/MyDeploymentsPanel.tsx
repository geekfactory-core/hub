import {Flex} from 'antd';
import {useMyDeploymentsProviderContext} from 'frontend/src/context/myDeployments/MyDeploymentsProvider';
import {i18} from 'frontend/src/i18';
import {ReloadIconButton} from '../../widgets/button/ReloadIconButton';
import {PanelCard} from '../../widgets/PanelCard';
import {PanelHeader} from '../../widgets/PanelHeader';
import {Form} from './Form';
import {MyDeploymentsList} from './MyDeploymentsList';

export const MyDeploymentsPanel = () => {
    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <Flex justify="space-between">
                    <PanelHeader title={i18.myDeployments.pageTitle} />
                    <RefreshButton />
                </Flex>
                <Form />
                <MyDeploymentsList />
            </Flex>
        </PanelCard>
    );
};

const RefreshButton = () => {
    const {feature, fetchRemoteData} = useMyDeploymentsProviderContext();
    if (feature.error.isError) {
        return null;
    }
    const {inProgress, loaded} = feature.status;
    const disabled = inProgress || !loaded;
    return <ReloadIconButton onClick={() => fetchRemoteData()} disabled={disabled} loading={inProgress} />;
};
