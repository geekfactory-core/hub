import {Flex} from 'antd';
import {ReloadIconButton} from 'frontend/src/components/widgets/button/ReloadIconButton';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {useDeploymentContextSafe} from 'frontend/src/context/deployment/DeploymentProvider';
import {DeploymentEventsProvider, useDeploymentEventsProviderContext} from 'frontend/src/context/deployment/events/DeploymentEventsProvider';
import {i18} from 'frontend/src/i18';
import type {DeploymentEventsSortingKey} from 'src/declarations/hub/hub.did';
import {ContractDeploymentPanelHeader} from './ContractDeploymentPanelHeader';
import {DeploymentEventsTable} from './DeploymentEventsTable';

export const DeploymentEventsPage = () => {
    const {deployment} = useDeploymentContextSafe();
    return (
        <DeploymentEventsProvider deploymentId={deployment.deployment_id} mapTableColumnToDeploymentEventsSortingKey={mapTableColumnToDeploymentEventsSortingKey}>
            <Inner />
        </DeploymentEventsProvider>
    );
};

const Inner = () => {
    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <Flex justify="space-between">
                    <ContractDeploymentPanelHeader title={i18.deploymentEvents.panelTitle} />
                    <RefreshButton />
                </Flex>
                <DeploymentEventsTable />
            </Flex>
        </PanelCard>
    );
};

const RefreshButton = () => {
    const {feature, fetchRemoteData} = useDeploymentEventsProviderContext();
    if (feature.error.isError) {
        return null;
    }
    const {inProgress, loaded} = feature.status;
    const disabled = inProgress || !loaded;
    return <ReloadIconButton onClick={() => fetchRemoteData()} disabled={disabled} loading={inProgress} />;
};

export const DEPLOYMENT_EVENTS_TABLE_COLUMN_KEY__CREATED = 'created';

const mapTableColumnToDeploymentEventsSortingKey = (columnKey: string): DeploymentEventsSortingKey | undefined => {
    switch (columnKey) {
        case DEPLOYMENT_EVENTS_TABLE_COLUMN_KEY__CREATED:
            return {EventId: null};
        default:
            return undefined;
    }
};
