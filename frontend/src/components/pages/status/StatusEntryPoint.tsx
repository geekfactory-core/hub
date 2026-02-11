import {Flex} from 'antd';
import {Canisters} from 'frontend/src/constants';
import {AccessRightsProvider} from 'frontend/src/context/hub/accessRights/AccessRightsProvider';
import {CanisterStatusProvider} from 'frontend/src/context/ic/canisterStatus/CanisterStatusProvider';
import {LoggerEventsProvider} from 'frontend/src/context/logger/LoggerEventsProvider';
import {i18} from 'frontend/src/i18';
import {AccessRightsPanel} from './accessRights/AccessRightsPanel';
import {CanisterStatusPanel} from './canisterStatus/CanisterStatusPanel';
import {HubConfigPanel} from './config/HubConfigPanel';
import {HubEventsPanel} from './hubEvents/HubEventsPanel';
import {LoggerEventsPanel} from './loggerEvents/LoggerEventsPanel';

export const StatusEntryPoint = () => {
    return (
        <Flex vertical gap={16}>
            <CanisterStatusProvider canisterId={Canisters.hub}>
                <CanisterStatusPanel panelTitle={i18.status.canisterStatus.backend.panelTitle} />
            </CanisterStatusProvider>
            <CanisterStatusProvider canisterId={Canisters.hubFrontend}>
                <CanisterStatusPanel panelTitle={i18.status.canisterStatus.frontend.panelTitle} />
            </CanisterStatusProvider>
            <HubConfigPanel />
            <AccessRightsProvider>
                <AccessRightsPanel />
            </AccessRightsProvider>
            <HubEventsPanel />
            <LoggerEventsProvider>
                <LoggerEventsPanel />
            </LoggerEventsProvider>
        </Flex>
    );
};
