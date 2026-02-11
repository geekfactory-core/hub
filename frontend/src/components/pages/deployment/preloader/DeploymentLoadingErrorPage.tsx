import {AlertActionButton} from 'frontend/src/components/widgets/alert/AlertActionButton';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {useDeploymentContext} from 'frontend/src/context/deployment/DeploymentProvider';
import {i18} from 'frontend/src/i18';

export const DeploymentLoadingErrorPage = () => {
    const {feature, fetchCurrentDeployment} = useDeploymentContext();
    return <ErrorAlertWithAction message={i18.deployment.stub.error} action={<AlertActionButton onClick={fetchCurrentDeployment} loading={feature.status.inProgress} />} large />;
};
