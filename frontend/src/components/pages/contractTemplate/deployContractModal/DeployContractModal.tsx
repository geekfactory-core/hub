import {Flex, Typography} from 'antd';
import {PanelLoadingComponent} from 'frontend/src/components/widgets/PanelLoadingComponent';
import {applicationLogger} from 'frontend/src/context/logger/logger';
import {exhaustiveCheckFailedMessage} from 'frontend/src/context/logger/loggerConstants';
import {i18} from 'frontend/src/i18';
import {type ReactNode, useEffect, useMemo} from 'react';
import {ConversionRateAutoFetcher} from './ConversionRateAutoFetcher';
import {useDeployContractModalDataContext} from './DeployContractModalDataProvider';
import {ErrorDeployingContract} from './ErrorDeployingContract';
import {Footer} from './footer/Footer';
import {InfoPanel} from './InfoPanel';
import {ErrorContractTemplateBlocked} from './stub/ErrorContractTemplateBlocked';
import {ErrorDeploymentNotAllowedOnTheBackend} from './stub/ErrorDeploymentNotAllowedOnTheBackend';
import {ErrorHasActiveDeployment} from './stub/ErrorHasActiveDeployment';
import {ErrorNoContractTemplate} from './stub/ErrorNoContractTemplate';
import type {RequiredDataNotAvailableReason, UnableToShowDeploymentModalFormReason, UnableToStartDeploymentProcessReason} from './useRequiredData';

export const DeployContractModal = () => {
    const {
        requiredData: {requiredDataState}
    } = useDeployContractModalDataContext();

    useEffect(() => {
        applicationLogger.debug('DeployContractModal: requiredDataState changed', {requiredDataState});
    }, [requiredDataState]);

    return useMemo(() => {
        let modalContent: ReactNode = null;
        const {type} = requiredDataState;
        switch (type) {
            case 'loading': {
                modalContent = <PanelLoadingComponent message={i18.contractTemplate.deployModal.stub.loading} />;
                break;
            }
            case 'notAvailable': {
                const reason: RequiredDataNotAvailableReason = requiredDataState.reason;
                const {type: reasonType} = reason;
                switch (reasonType) {
                    case 'connectedWalletIcrcAccountNotAvailable':
                    case 'icrcSpenderNotAvailable':
                    case 'icrcMetadataNotAvailable':
                    case 'allowanceNotAvailable':
                    case 'hubDataNotAvailable':
                    case 'conversionRateNotAvailable':
                    case 'contractTemplateInformationNotAvailable':
                    case 'activeDeploymentDataNotAvailable': {
                        modalContent = (
                            <Flex vertical gap={16}>
                                <ErrorNoContractTemplate />
                                <Footer />
                            </Flex>
                        );
                        break;
                    }
                    default: {
                        const exhaustiveCheck: never = reasonType;
                        applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
                    }
                }
                break;
            }
            case 'unableToShowDeploymentModalFormReason': {
                const reason: UnableToShowDeploymentModalFormReason = requiredDataState.reason;
                const {type: reasonType} = reason;
                switch (reasonType) {
                    case 'deploymentNotAllowedOnTheBackend': {
                        modalContent = (
                            <Flex vertical gap={16}>
                                <ErrorDeploymentNotAllowedOnTheBackend />
                                <Footer />
                            </Flex>
                        );
                        break;
                    }
                    case 'calculateDeploymentExpensesError': {
                        modalContent = (
                            <Flex vertical gap={16}>
                                <ErrorNoContractTemplate />
                                <Footer />
                            </Flex>
                        );
                        break;
                    }
                    default: {
                        const exhaustiveCheck: never = reasonType;
                        applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
                    }
                }
                break;
            }
            case 'unableToStartDeploymentProcess': {
                const reason: UnableToStartDeploymentProcessReason = requiredDataState.reason;
                const {type: reasonType} = reason;
                switch (reasonType) {
                    case 'activeDeploymentExists': {
                        modalContent = (
                            <Flex vertical gap={16}>
                                <InfoPanel />
                                <ErrorHasActiveDeployment />
                                <ConversionRateAutoFetcher />
                                <Footer />
                            </Flex>
                        );
                        break;
                    }
                    case 'contractTemplateBlocked': {
                        modalContent = (
                            <Flex vertical gap={16}>
                                <InfoPanel />
                                <ErrorContractTemplateBlocked />
                                <Footer />
                            </Flex>
                        );
                        break;
                    }
                    default: {
                        const exhaustiveCheck: never = reasonType;
                        applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
                    }
                }
                break;
            }
            case 'readyToStartDeploymentProcess': {
                modalContent = (
                    <Flex vertical gap={16}>
                        <InfoPanel />
                        <ErrorDeployingContract />
                        <ConversionRateAutoFetcher />
                        <Footer />
                    </Flex>
                );
                break;
            }
            default: {
                const exhaustiveCheck: never = type;
                applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
            }
        }

        return (
            <Flex vertical gap={16}>
                <Typography.Title level={5}>{i18.contractTemplate.deployModal.title}</Typography.Title>
                <div>{modalContent}</div>
            </Flex>
        );
    }, [requiredDataState]);
};
