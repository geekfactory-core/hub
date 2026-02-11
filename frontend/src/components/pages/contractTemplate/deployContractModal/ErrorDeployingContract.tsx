import {useDeployContractModalDataContext} from './DeployContractModalDataProvider';

export const ErrorDeployingContract = () => {
    const {actionErrorPanel} = useDeployContractModalDataContext();
    return actionErrorPanel;
};
