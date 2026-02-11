import {Flex} from 'antd';
import {i18} from 'frontend/src/i18';
import {PanelCard} from '../../widgets/PanelCard';
import {PanelHeader} from '../../widgets/PanelHeader';
import {ValidateContractForm} from './form/ValidateContractForm';

export const ValidateContractEntryPoint = () => {
    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <PanelHeader title={i18.validateContract.form.panelTitle} />
                <ValidateContractForm />
            </Flex>
        </PanelCard>
    );
};
