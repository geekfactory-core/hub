import {ContractDeploymentsProvider} from 'frontend/src/context/contractTemplate/ContractDeploymentsProvider';
import type {DeploymentsSortingKey} from 'src/declarations/hub/hub.did';
import {ContractDeploymentsPanel} from './ContractDeploymentsPanel';

export const ContractDeploymentsEntryPoint = () => {
    return (
        <ContractDeploymentsProvider mapTableColumnToDeploymentsSortingKey={mapTableColumnToDeploymentsSortingKey}>
            <ContractDeploymentsPanel />
        </ContractDeploymentsProvider>
    );
};

export const CONTRACT_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED = 'created';

const mapTableColumnToDeploymentsSortingKey = (columnKey: string): DeploymentsSortingKey | undefined => {
    switch (columnKey) {
        case CONTRACT_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED:
            return {DeploymentId: null};
        default:
            return undefined;
    }
};
