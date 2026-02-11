import {Flex} from 'antd';
import {ReloadIconButton} from 'frontend/src/components/widgets/button/ReloadIconButton';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {HubEventsProvider, useHubEventsProviderContext} from 'frontend/src/context/hub/events/HubEventsProvider';
import {i18} from 'frontend/src/i18';
import type {HubEventsSortingKey} from 'src/declarations/hub/hub.did';
import {HubEventsTable} from './HubEventsTable';

export const HubEventsPanel = () => {
    return (
        <HubEventsProvider mapTableColumnToHubEventsSortingKey={mapTableColumnToHubEventsSortingKey}>
            <Inner />
        </HubEventsProvider>
    );
};

const Inner = () => {
    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <Flex justify="space-between">
                    <PanelHeader title={i18.status.hubEvents.panelTitle} />
                    <RefreshButton />
                </Flex>
                <HubEventsTable />
            </Flex>
        </PanelCard>
    );
};

const RefreshButton = () => {
    const {feature, fetchRemoteData} = useHubEventsProviderContext();
    if (feature.error.isError) {
        return null;
    }
    const {inProgress, loaded} = feature.status;
    const disabled = inProgress || !loaded;
    return <ReloadIconButton onClick={() => fetchRemoteData()} disabled={disabled} loading={inProgress} />;
};

export const HUB_EVENTS_TABLE_COLUMN_KEY__CREATED = 'created';

const mapTableColumnToHubEventsSortingKey = (columnKey: string): HubEventsSortingKey | undefined => {
    if (columnKey == HUB_EVENTS_TABLE_COLUMN_KEY__CREATED) {
        return {EventId: null};
    }
    return undefined;
};
