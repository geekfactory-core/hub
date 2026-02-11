import {Flex, Typography} from 'antd';
import {i18} from 'frontend/src/i18';
import {PanelCard} from '../../widgets/PanelCard';
import {ValidateContractForm} from '../validate/form/ValidateContractForm';
import {LatestContractTemplatesPanel} from './latestContractTemplates/LatestContractTemplatesPanel';

export const HomeEntryPoint = () => {
    return (
        <Flex vertical gap={32}>
            <PanelCard>
                <Flex gap={16} vertical style={{marginTop: 16, marginBottom: 16}} className="gf-ta-center1">
                    <Typography.Title level={3}>{i18.home.title}</Typography.Title>
                    <div className="gf-tw-balance">{i18.home.description}</div>
                </Flex>
            </PanelCard>
            <PanelCard>
                <Flex vertical gap={16}>
                    <Typography.Title level={4}>{i18.home.validate.title}</Typography.Title>
                    <ValidateContractForm />
                </Flex>
            </PanelCard>
            <LatestContractTemplatesPanel />
        </Flex>
    );
};
