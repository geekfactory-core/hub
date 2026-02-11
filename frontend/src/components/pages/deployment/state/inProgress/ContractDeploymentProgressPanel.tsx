import {isNullish} from '@dfinity/utils';
import {Flex} from 'antd';
import {WarningAlert} from 'frontend/src/components/widgets/alert/WarningAlert';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {useDeploymentContextSafe} from 'frontend/src/context/deployment/DeploymentProvider';
import {i18} from 'frontend/src/i18';
import {useContractStatusContext} from '../../context/ContractStatusProvider';
import {DeploymentProgressSteps} from './DeploymentProgressSteps';

export const ContractDeploymentProgressPanel = () => {
    const {isOwnedByCurrentUser} = useDeploymentContextSafe();
    const {contractDeploymentState} = useContractStatusContext();

    if (isNullish(contractDeploymentState)) {
        // Illegal state - we should never reach here.
        return null;
    }
    if (contractDeploymentState.type != 'deploying') {
        return null;
    }
    if (!isOwnedByCurrentUser) {
        return null;
    }
    return <Content />;
};

const Content = () => {
    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <PanelHeader title={i18.deployment.contractDeployment.panelTitle} />
                <WarningAlert message={i18.deployment.contractDeployment.panelDescription} style={{marginBottom: 15}} />
                <DeploymentProgressSteps />
            </Flex>
        </PanelCard>
    );
};
