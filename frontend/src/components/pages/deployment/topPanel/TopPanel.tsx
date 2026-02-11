import {isNullish} from '@dfinity/utils';
import {Flex} from 'antd';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {i18} from 'frontend/src/i18';
import {useContractStatusContext} from '../context/ContractStatusProvider';
import {ContractStatusSteps} from './ContractStatusSteps';
import {ContractStatusWarning} from './ContractStatusWarning';

export const TopPanel = () => {
    const {contractDeploymentState} = useContractStatusContext();

    if (isNullish(contractDeploymentState)) {
        // Illegal state - we should never reach here.
        return null;
    }

    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <PanelHeader title={i18.deployment.contractStatus.panelTitle} />
                <Flex vertical gap={32}>
                    <ContractStatusSteps />
                    <ContractStatusWarning />
                </Flex>
            </Flex>
        </PanelCard>
    );
};
