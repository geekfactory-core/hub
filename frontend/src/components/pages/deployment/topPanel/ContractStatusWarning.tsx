import {isNullish} from '@dfinity/utils';
import {Flex} from 'antd';
import {AlertActionButton} from 'frontend/src/components/widgets/alert/AlertActionButton';
import {ErrorAlert} from 'frontend/src/components/widgets/alert/ErrorAlert';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {SuccessAlert} from 'frontend/src/components/widgets/alert/SuccessAlert';
import {WarningAlert} from 'frontend/src/components/widgets/alert/WarningAlert';
import {useContractTemplateContextSafe} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import {applicationLogger} from 'frontend/src/context/logger/logger';
import {exhaustiveCheckFailedMessage} from 'frontend/src/context/logger/loggerConstants';
import {i18} from 'frontend/src/i18';
import {useContractStatusContext} from '../context/ContractStatusProvider';
import {LinkToContractComponent} from './LinkToContractComponent';

export const ContractStatusWarning = () => {
    return (
        <Flex vertical gap={8}>
            <SuccessComponent />
            <ContractTemplateWarning />
            <ContractDeploymentWarning />
            <ContractActivationWarning />
            <ContractValidationWarning />
        </Flex>
    );
};

const SuccessComponent = () => {
    const {isItSafeToUseContract} = useContractStatusContext();
    if (isItSafeToUseContract) {
        return (
            <Flex vertical gap={16}>
                <SuccessAlert message={i18.deployment.contractStatus.warning.success} />
                <LinkToContractComponent />
            </Flex>
        );
    }
    return null;
};

const ContractTemplateWarning = () => {
    const {dataAvailability} = useContractTemplateContextSafe();
    const {contractActivationDataAvailability, contractValidationDataAvailability} = useContractStatusContext();
    if (contractActivationDataAvailability.type == 'loading' || contractValidationDataAvailability.type == 'loading') {
        return null;
    }
    if (dataAvailability.type == 'blocked') {
        return <ErrorAlert message={i18.deployment.contractStatus.warning.templateState.contractTemplateBlocked} className="gf-all-caps" />;
    }
    return null;
};

const ContractDeploymentWarning = () => {
    const {contractDeploymentState} = useContractStatusContext();
    if (isNullish(contractDeploymentState)) {
        // Illegal state - we should never reach here.
        return null;
    }
    const {type} = contractDeploymentState;
    switch (type) {
        case 'deploying': {
            return <WarningAlert message={i18.deployment.contractStatus.warning.contractState.deploying} />;
        }
        case 'success': {
            return null;
        }
        case 'terminated': {
            return <ErrorAlert message={i18.deployment.contractStatus.warning.contractState.terminated} />;
        }
        default: {
            const exhaustiveCheck: never = type;
            applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
            return null;
        }
    }
};

const ContractActivationWarning = () => {
    const {contractDeploymentState, contractActivationDataAvailability, contractActivationStateFeature, contractValidationDataAvailability, fetchNotAvailableData} = useContractStatusContext();
    if (isNullish(contractDeploymentState)) {
        // Illegal state - we should never reach here.
        return null;
    }
    if (contractDeploymentState.type != 'success') {
        return null;
    }
    if (contractValidationDataAvailability.type == 'loading') {
        return null;
    }
    const {type} = contractActivationDataAvailability;
    switch (type) {
        case 'available': {
            const {type: activationStateType} = contractActivationDataAvailability.activationState;
            switch (activationStateType) {
                case 'activated': {
                    return null;
                }
                case 'notActivated': {
                    return <WarningAlert message={i18.deployment.contractStatus.warning.activationState.activationRequired} />;
                }
                case 'activationNotRequired': {
                    return null;
                }
                default: {
                    const exhaustiveCheck: never = activationStateType;
                    applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
                    return null;
                }
            }
        }
        case 'notAvailable': {
            return (
                <ErrorAlertWithAction
                    message={i18.deployment.contractStatus.warning.activationState.unableToLoad}
                    action={<AlertActionButton onClick={fetchNotAvailableData} loading={contractActivationStateFeature.status.inProgress} />}
                />
            );
        }
        case 'loading':
        case 'notApplicable':
        case 'notRequired': {
            return null;
        }
        default: {
            const exhaustiveCheck: never = type;
            applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
            return null;
        }
    }
};

const ContractValidationWarning = () => {
    const {contractDeploymentState, contractValidationDataAvailability, contractValidationStateFeature, contractActivationDataAvailability, fetchNotAvailableData} = useContractStatusContext();
    if (isNullish(contractDeploymentState)) {
        // Illegal state - we should never reach here.
        return null;
    }
    if (contractDeploymentState.type != 'success') {
        return null;
    }
    if (contractActivationDataAvailability.type == 'loading') {
        return null;
    }
    const {type} = contractValidationDataAvailability;
    switch (type) {
        case 'available': {
            const {type: validationStateType} = contractValidationDataAvailability.validationState;
            switch (validationStateType) {
                case 'certificateValidAndActive': {
                    return null;
                }
                case 'certificateValidButExpired': {
                    return <ErrorAlert message={i18.deployment.contractStatus.warning.validationState.certificateExpired} className="gf-all-caps" />;
                }
                case 'backendErrorWithRetry': {
                    return (
                        <ErrorAlertWithAction
                            message={i18.deployment.contractStatus.warning.validationState.unableToValidate}
                            action={<AlertActionButton onClick={fetchNotAvailableData} loading={contractValidationStateFeature.status.inProgress} />}
                        />
                    );
                }
                case 'validationFatalError': {
                    return <ErrorAlert message={i18.deployment.contractStatus.warning.validationState.certificateInvalid} className="gf-all-caps" />;
                }
                default: {
                    const exhaustiveCheck: never = validationStateType;
                    applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
                    return null;
                }
            }
        }
        case 'notAvailable': {
            return (
                <ErrorAlertWithAction
                    message={i18.deployment.contractStatus.warning.validationState.unableToLoad}
                    action={<AlertActionButton onClick={fetchNotAvailableData} loading={contractValidationStateFeature.status.inProgress} />}
                />
            );
        }
        case 'loading':
        case 'notApplicable': {
            return null;
        }
        default: {
            const exhaustiveCheck: never = type;
            applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
            return null;
        }
    }
};
