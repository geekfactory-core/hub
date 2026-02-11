import {MyDeploymentsProvider} from 'frontend/src/context/myDeployments/MyDeploymentsProvider';
import type {DeploymentsSortingKey} from 'src/declarations/hub/hub.did';
import {MyDeploymentsPanel} from './MyDeploymentsPanel';

export const MyDeploymentsEntryPoint = () => {
    return (
        <MyDeploymentsProvider mapTableColumnToDeploymentsSortingKey={mapTableColumnToDeploymentsSortingKey}>
            <MyDeploymentsPanel />
        </MyDeploymentsProvider>
    );
};

export const MY_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED = 'created';

const mapTableColumnToDeploymentsSortingKey = (columnKey: string): DeploymentsSortingKey | undefined => {
    if (columnKey == MY_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED) {
        return {DeploymentId: null};
    }
    return undefined;
};
