import {Flex} from 'antd';
import {DeploymentFooterPanel} from './footer/DeploymentFooterPanel';
import {CertificateDetailsPanel} from './state/complete/CertificateDetailsPanel';
import {ContractActivationPanel} from './state/complete/contractActivation/ContractActivationPanel';
import {DeploymentDetailsPanel} from './state/complete/DeploymentDetailsPanel';
import {ContractDeploymentProgressPanel} from './state/inProgress/ContractDeploymentProgressPanel';
import {TopPanel} from './topPanel/TopPanel';

export const DeploymentPage = () => {
    return (
        <Flex vertical gap={16}>
            <TopPanel />
            <ContractDeploymentProgressPanel />
            <ContractActivationPanel />
            <DeploymentDetailsPanel />
            <CertificateDetailsPanel />
            <DeploymentFooterPanel />
        </Flex>
    );
};
