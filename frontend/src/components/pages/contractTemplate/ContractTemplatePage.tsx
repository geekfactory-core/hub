import {Flex} from 'antd';
import {CanisterSettingsPanel} from './panel/CanisterSettingsPanel';
import {DetailsPanel} from './panel/DetailsPanel';
import {HeaderPanel} from './panel/HeaderPanel';

export const ContractTemplatePage = () => {
    return (
        <Flex vertical gap={16}>
            <HeaderPanel />
            <DetailsPanel />
            <CanisterSettingsPanel />
        </Flex>
    );
};
