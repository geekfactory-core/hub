import {Modal} from 'antd';
import {DefaultButton} from 'frontend/src/components/widgets/button/DefaultButton';
import {PrimaryButton} from 'frontend/src/components/widgets/button/PrimaryButton';
import {DEFAULT_MODAL_PROPS} from 'frontend/src/components/widgets/modalUtils';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {useConfigDataContext} from 'frontend/src/context/hub/config/ConfigDataProvider';
import {i18} from 'frontend/src/i18';
import type {MouseEvent} from 'react';
import {useCallback, useMemo, useState} from 'react';
import {ConnectModal} from '../../auth/modal/ConnectModal';
import {ConnectModalDataProvider} from '../../auth/modal/ConnectModalDataProvider';
import {DeployContractModal} from './DeployContractModal';
import {DeployContractModalDataProvider} from './DeployContractModalDataProvider';

type Props = {
    targetContractTemplateId: bigint;
    contractTemplateBlocked: boolean;
};

export const DeployContractButton = (props: Props) => {
    const {targetContractTemplateId, contractTemplateBlocked} = props;

    if (contractTemplateBlocked) {
        return <ContractTemplateBlockedButton />;
    }
    return <DeployButton targetContractTemplateId={targetContractTemplateId} />;
};

const DeployButton = (props: {targetContractTemplateId: bigint}) => {
    const {targetContractTemplateId} = props;

    const {isDeploymentAllowedOnTheBackend} = useConfigDataContext();
    const [open, setOpen] = useState<boolean>(false);

    const buttonDisabled = !isDeploymentAllowedOnTheBackend;
    const buttonTitle = useMemo(() => {
        if (!isDeploymentAllowedOnTheBackend) {
            return i18.contractTemplate.action.deploy.tooltip.deploymentUnavailable;
        }
        return undefined;
    }, [isDeploymentAllowedOnTheBackend]);

    const onClick = useCallback((event: MouseEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setOpen(true);
        return false;
    }, []);

    const onCancelModal = useCallback(() => {
        setOpen(false);
    }, []);

    return (
        <>
            <Modal open={open} onCancel={onCancelModal} {...DEFAULT_MODAL_PROPS}>
                <ModalContent targetContractTemplateId={targetContractTemplateId} onCancelModal={onCancelModal} />
            </Modal>
            <PrimaryButton onClick={onClick} disabled={buttonDisabled} title={buttonTitle}>
                {i18.contractTemplate.action.deploy.available}
            </PrimaryButton>
        </>
    );
};

const ModalContent = ({targetContractTemplateId, onCancelModal}: {targetContractTemplateId: bigint; onCancelModal: () => void}) => {
    const {isAuthenticated} = useAuthContext();

    if (!isAuthenticated) {
        return (
            <ConnectModalDataProvider onCancelModal={onCancelModal}>
                <ConnectModal />
            </ConnectModalDataProvider>
        );
    }

    return (
        <DeployContractModalDataProvider contractTemplateId={targetContractTemplateId} onCancelModal={onCancelModal}>
            <DeployContractModal />
        </DeployContractModalDataProvider>
    );
};

const ContractTemplateBlockedButton = () => {
    return <DefaultButton disabled>{i18.contractTemplate.action.deploy.blocked}</DefaultButton>;
};
