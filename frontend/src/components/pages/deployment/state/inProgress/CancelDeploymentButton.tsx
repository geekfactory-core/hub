import {Flex, Modal} from 'antd';
import {ErrorAlert} from 'frontend/src/components/widgets/alert/ErrorAlert';
import {TextButton} from 'frontend/src/components/widgets/button/TextButton';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {useDeploymentProcessorContext} from 'frontend/src/context/deployment/DeploymentProcessor';
import {useDeploymentContextSafe} from 'frontend/src/context/deployment/DeploymentProvider';
import {i18} from 'frontend/src/i18';
import {useCallback, useMemo} from 'react';
import {isDeploymentTerminationPossible} from '../../../../../context/deployment/deploymentInformationUtils';

export const CancelDeploymentButton = () => {
    const {isAuthenticated} = useAuthContext();
    const {
        deployment: {deployment_id, state},
        isOwnedByCurrentUser
    } = useDeploymentContextSafe();
    const {
        cancelDeployment: {cancelDeployment, feature},
        shouldProcessManually,
        processInProgress
    } = useDeploymentProcessorContext();
    const {inProgress} = feature.status;
    const {isError} = feature.error;
    const [modal, contextHolder] = Modal.useModal();

    const terminationPossible = useMemo(() => isDeploymentTerminationPossible(state), [state]);

    const onClick = useCallback(() => {
        modal.confirm({
            title: i18.deployment.contractDeployment.terminate.modal.title,
            content: (
                <Flex vertical gap={16}>
                    <div>
                        <div>{i18.deployment.contractDeployment.terminate.modal.text1}</div>
                        <div>{i18.deployment.contractDeployment.terminate.modal.text2}</div>
                        <div>{i18.deployment.contractDeployment.terminate.modal.text3}</div>
                    </div>
                    {isError ? <ErrorAlert message={i18.common.error.unableTo} /> : null}
                </Flex>
            ),
            icon: null,
            okText: i18.deployment.contractDeployment.terminate.modal.ok,
            okButtonProps: {
                danger: true,
                className: 'gf-flex-auto'
            },
            onOk: async () => {
                await cancelDeployment({
                    deployment_id,
                    reason: 'user_terminated'
                });
            },
            cancelButtonProps: {
                className: 'gf-flex-auto'
            },
            width: 600,
            autoFocusButton: null,
            closable: false,
            maskClosable: false,
            keyboard: false
        });
    }, [cancelDeployment, deployment_id, modal, isError]);

    if (isAuthenticated && isOwnedByCurrentUser && terminationPossible && shouldProcessManually) {
        const disabled = inProgress || processInProgress;
        return (
            <>
                {contextHolder}
                <TextButton danger onClick={onClick} loading={inProgress} disabled={disabled}>
                    {i18.deployment.contractDeployment.terminate.terminateDeploymentButton}
                </TextButton>
            </>
        );
    }
    return null;
};
