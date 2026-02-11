import {Flex} from 'antd';
import {ReloadIconButton} from 'frontend/src/components/widgets/button/ReloadIconButton';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {useAccessRightsContext} from 'frontend/src/context/hub/accessRights/AccessRightsProvider';
import {i18} from 'frontend/src/i18';
import {AccessRightsList} from './AccessRightsList';

export const AccessRightsPanel = () => {
    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <Flex justify="space-between">
                    <PanelHeader title={i18.status.accessRights.panelTitle} />
                    <RefreshButton />
                </Flex>
                <AccessRightsList />
            </Flex>
        </PanelCard>
    );
};

const RefreshButton = () => {
    const {feature, fetchAccessRights} = useAccessRightsContext();
    const {inProgress, loaded} = feature.status;
    const disabled = inProgress || !loaded;
    return <ReloadIconButton onClick={() => fetchAccessRights()} disabled={disabled} loading={inProgress} />;
};
