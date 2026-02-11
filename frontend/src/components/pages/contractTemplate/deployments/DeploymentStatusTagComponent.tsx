import {Tag} from 'antd';
import {getContractDeploymentState} from 'frontend/src/context/deployment/deploymentInformationUtils';
import {applicationLogger} from 'frontend/src/context/logger/logger';
import {exhaustiveCheckFailedMessage} from 'frontend/src/context/logger/loggerConstants';
import {i18} from 'frontend/src/i18';
import {useMemo} from 'react';
import type {DeploymentInformation} from 'src/declarations/hub/hub.did';

export const DeploymentStatusTagComponent = (props: {deploymentInformation: DeploymentInformation}) => {
    const {deploymentInformation} = props;
    const deploymentDeploymentState = useMemo(() => getContractDeploymentState(deploymentInformation.state, deploymentInformation.contract_canister), [deploymentInformation]);
    const type = deploymentDeploymentState?.type;
    switch (type) {
        case undefined:
        case 'deploying': {
            return <Tag color="warning">{i18.deployments.table.status.deploying}</Tag>;
        }
        case 'success': {
            return <Tag color="success">{i18.deployments.table.status.deployed}</Tag>;
        }
        case 'terminated': {
            return <Tag color="error">{i18.deployments.table.status.terminated}</Tag>;
        }
        default: {
            const exhaustiveCheck: never = type;
            applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
        }
    }
};
