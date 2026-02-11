import {DefaultButton} from 'frontend/src/components/widgets/button/DefaultButton';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {useDeploymentProcessorContext} from 'frontend/src/context/deployment/DeploymentProcessor';
import {i18} from 'frontend/src/i18';

export const ProcessManuallyButton = () => {
    const {isAuthenticated} = useAuthContext();
    const {cancelDeployment, tryToProcessManually, shouldProcessManually, processInProgress} = useDeploymentProcessorContext();
    if (isAuthenticated && shouldProcessManually) {
        const cancelDeploymentInProgress = cancelDeployment.feature.status.inProgress;
        const disabled = processInProgress || cancelDeploymentInProgress;
        return (
            <DefaultButton onClick={() => tryToProcessManually()} loading={processInProgress} disabled={disabled} block>
                {i18.common.button.retryButton}
            </DefaultButton>
        );
    }
    return null;
};
