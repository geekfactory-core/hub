import {CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, LoadingOutlined, StopOutlined} from '@ant-design/icons';
import {Flex} from 'antd';
import {useContractTemplateContextSafe} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import {useDeploymentProcessorContext} from 'frontend/src/context/deployment/DeploymentProcessor';
import {useDeploymentContextSafe} from 'frontend/src/context/deployment/DeploymentProvider';
import {applicationLogger} from 'frontend/src/context/logger/logger';
import {exhaustiveCheckFailedMessage} from 'frontend/src/context/logger/loggerConstants';
import {i18} from 'frontend/src/i18';
import {useMemo, type CSSProperties} from 'react';
import {useContractStatusContext} from '../context/ContractStatusProvider';

export const ContractStatusSteps = () => {
    return (
        <Flex wrap style={{columnGap: 40, rowGap: 8}}>
            <TemplateStateStep />
            <ContractStateStep />
            <ActivationStateStep />
            <CertificateStep />
        </Flex>
    );
};

type StatusProto = {icon: IconType; status: string; color: Color};
const loadingStatusProto: StatusProto = {icon: 'loading', status: i18.deployment.contractStatus.common.loading, color: 'gray'};
const failedToLoadStatusProto: (loading?: boolean) => StatusProto = (loading) => ({icon: loading ? 'loading' : 'error', status: i18.deployment.contractStatus.common.error, color: 'red'});
const notApplicableStatusProto: StatusProto = {icon: 'stop', status: i18.deployment.contractStatus.common.notApplicable, color: 'gray'};
const waitingStatusProto: StatusProto = {icon: 'clock', status: i18.deployment.contractStatus.common.waiting, color: 'gray'};
const invalidStateStatusProto: StatusProto = {icon: 'exclamation', status: i18.deployment.contractStatus.common.notApplicable, color: 'gray'};
const activationNotRequiredStatusProto: StatusProto = {icon: 'success', status: i18.deployment.contractStatus.activationState.notRequired, color: 'green'};

const TemplateStateStep = () => {
    const {dataAvailability} = useContractTemplateContextSafe();
    const contractTemplateBlocked = dataAvailability.type == 'blocked';
    const icon: IconType = contractTemplateBlocked ? 'exclamation' : 'success';
    const color: Color = contractTemplateBlocked ? 'red' : 'green';
    const status = contractTemplateBlocked ? i18.deployment.contractStatus.templateState.blocked : i18.deployment.contractStatus.templateState.active;
    return <StepCard icon={icon} title={i18.deployment.contractStatus.templateState.title} status={status} color={color} />;
};

const ContractStateStep = () => {
    const {isOwnedByCurrentUser} = useDeploymentContextSafe();
    const {contractDeploymentState} = useContractStatusContext();
    const {shouldProcessManually} = useDeploymentProcessorContext();

    const {icon, status, color} = useMemo<StatusProto>(() => {
        const type = contractDeploymentState?.type;
        switch (type) {
            case 'deploying': {
                if (isOwnedByCurrentUser && shouldProcessManually) {
                    const icon: IconType = 'error';
                    const status: string = i18.deployment.contractStatus.common.error;
                    const color: Color = 'red';
                    return {icon, status, color};
                }
                const icon: IconType = 'loading';
                const status: string = i18.deployment.contractStatus.contractState.deploying;
                const color: Color = 'gray';
                return {icon, status, color};
            }
            case 'success': {
                return {icon: 'success', status: i18.deployment.contractStatus.contractState.deployed, color: 'green'};
            }
            case 'terminated': {
                return {icon: 'exclamation', status: i18.deployment.contractStatus.contractState.terminated, color: 'red'};
            }
            case undefined: {
                // Illegal state - we should never reach here.
                return invalidStateStatusProto;
            }
            default: {
                // Illegal state - we should never reach here.
                const exhaustiveCheck: never = type;
                applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
                return invalidStateStatusProto;
            }
        }
    }, [contractDeploymentState?.type, shouldProcessManually, isOwnedByCurrentUser]);

    return <StepCard icon={icon} title={i18.deployment.contractStatus.contractState.title} status={status} color={color} />;
};

const ActivationStateStep = () => {
    const {contractDeploymentState} = useContractStatusContext();
    const {contractActivationDataAvailability, contractActivationStateFeature} = useContractStatusContext();
    const {inProgress} = contractActivationStateFeature.status;

    const {icon, status, color} = useMemo<StatusProto>(() => {
        const type = contractActivationDataAvailability.type;
        switch (type) {
            case 'notRequired': {
                if (contractDeploymentState?.type == 'terminated') {
                    return notApplicableStatusProto;
                } else if (contractDeploymentState?.type == 'deploying') {
                    return waitingStatusProto;
                }
                return activationNotRequiredStatusProto;
            }
            case 'notApplicable': {
                if (contractDeploymentState?.type == 'deploying') {
                    return waitingStatusProto;
                }
                return notApplicableStatusProto;
            }
            case 'loading': {
                return loadingStatusProto;
            }
            case 'available': {
                const {type: activationStateType} = contractActivationDataAvailability.activationState;
                switch (activationStateType) {
                    case 'activated': {
                        return {icon: 'success', status: i18.deployment.contractStatus.activationState.activated, color: 'green'};
                    }
                    case 'notActivated': {
                        return {icon: 'exclamation', status: i18.deployment.contractStatus.activationState.required, color: 'orange'};
                    }
                    case 'activationNotRequired': {
                        if (contractDeploymentState?.type != 'success') {
                            return notApplicableStatusProto;
                        }
                        return activationNotRequiredStatusProto;
                    }
                    default: {
                        const exhaustiveCheck: never = activationStateType;
                        applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
                        return invalidStateStatusProto;
                    }
                }
            }
            case 'notAvailable': {
                return failedToLoadStatusProto(inProgress);
            }
            default: {
                const exhaustiveCheck: never = type;
                applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
                return invalidStateStatusProto;
            }
        }
    }, [inProgress, contractActivationDataAvailability, contractDeploymentState?.type]);

    return <StepCard icon={icon} title={i18.deployment.contractStatus.activationState.title} status={status} color={color} />;
};

const CertificateStep = () => {
    const {contractDeploymentState} = useContractStatusContext();
    const {contractValidationDataAvailability, contractValidationStateFeature} = useContractStatusContext();
    const {inProgress} = contractValidationStateFeature.status;

    const {icon, status, color} = useMemo<{icon: IconType; status: string; color: Color}>(() => {
        const type = contractValidationDataAvailability.type;
        switch (type) {
            case 'notApplicable': {
                if (contractDeploymentState?.type == 'deploying') {
                    return waitingStatusProto;
                }
                return notApplicableStatusProto;
            }
            case 'loading': {
                return loadingStatusProto;
            }
            case 'available': {
                const {type: validationStateType} = contractValidationDataAvailability.validationState;
                switch (validationStateType) {
                    case 'certificateValidAndActive': {
                        return {icon: 'success', status: i18.deployment.contractStatus.certificate.valid, color: 'green'};
                    }
                    case 'certificateValidButExpired': {
                        return {icon: 'exclamation', status: i18.deployment.contractStatus.certificate.expired, color: 'red'};
                    }
                    case 'backendErrorWithRetry': {
                        return failedToLoadStatusProto(inProgress);
                    }
                    case 'validationFatalError': {
                        return {icon: 'exclamation', status: i18.deployment.contractStatus.certificate.invalid, color: 'red'};
                    }
                    default: {
                        const exhaustiveCheck: never = validationStateType;
                        applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
                        return invalidStateStatusProto;
                    }
                }
            }
            case 'notAvailable': {
                return failedToLoadStatusProto(inProgress);
            }
            default: {
                const exhaustiveCheck: never = type;
                applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
                return invalidStateStatusProto;
            }
        }
    }, [inProgress, contractValidationDataAvailability, contractDeploymentState?.type]);

    return <StepCard icon={icon} title={i18.deployment.contractStatus.certificate.title} status={status} color={color} />;
};

const StepCard = (props: {icon: IconType; title: string; status: string; color: Color}) => {
    return (
        <Flex gap={16} wrap={false}>
            <Icon icon={props.icon} color={props.color} size={32} />
            <div>
                <div>{props.title}</div>
                <div style={{color: props.color}} className="gf-font-size-smaller">
                    {props.status}
                </div>
            </div>
        </Flex>
    );
};

type IconType = 'loading' | 'error' | 'success' | 'exclamation' | 'stop' | 'clock';
type Color = 'black' | 'orange' | 'red' | 'green' | 'gray';
const Icon = (props: {icon: IconType; color: Color; size: number}) => {
    const style: CSSProperties = {color: props.color, fontSize: props.size};
    switch (props.icon) {
        case 'loading':
            return <LoadingOutlined style={style} />;
        case 'error':
            return <CloseCircleOutlined style={style} />;
        case 'success':
            return <CheckCircleOutlined style={style} />;
        case 'exclamation':
            return <ExclamationCircleOutlined style={style} />;
        case 'stop':
            return <StopOutlined style={style} />;
        case 'clock':
            return <ClockCircleOutlined style={style} />;
        default: {
            const exhaustiveCheck: never = props.icon;
            applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
            return null;
        }
    }
};
