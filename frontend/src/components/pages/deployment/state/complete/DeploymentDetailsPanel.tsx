import {isNullish} from '@dfinity/utils';
import {Flex} from 'antd';
import {LoadingAndFailedToLoadValueWrapper} from 'frontend/src/components/widgets/alert/LoadingAndFailedToLoadValueWrapper';
import {KeyValueVertical} from 'frontend/src/components/widgets/KeyValueVertical';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {CopyableUIDComponent} from 'frontend/src/components/widgets/uid/CopyableUIDComponent';
import {useContractTemplateContextSafe} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import {useDeploymentContextSafe} from 'frontend/src/context/deployment/DeploymentProvider';
import {useConfigDataContext} from 'frontend/src/context/hub/config/ConfigDataProvider';
import {applicationLogger} from 'frontend/src/context/logger/logger';
import {exhaustiveCheckFailedMessage} from 'frontend/src/context/logger/loggerConstants';
import {i18} from 'frontend/src/i18';
import {formatDateTime} from 'frontend/src/utils/core/date/format';
import {useMemo, type PropsWithChildren} from 'react';
import {Link} from 'react-router-dom';
import {RouterPaths} from '../../../skeleton/Router';
import {useContractStatusContext} from '../../context/ContractStatusProvider';

export const DeploymentDetailsPanel = () => {
    const {contractDeploymentState} = useContractStatusContext();

    if (isNullish(contractDeploymentState)) {
        // Illegal state - we should never reach here.
        return null;
    }
    if (contractDeploymentState.type == 'deploying') {
        return null;
    }

    return <Content />;
};

const Content = () => {
    const {deployment} = useDeploymentContextSafe();
    const {contractTemplateInformation} = useContractTemplateContextSafe();

    const createdOnText = useMemo(() => formatDateTime(Number(deployment.created)), [deployment.created]);

    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <PanelHeader title={i18.deployment.deploymentDetails.panelDescription} />
                <Flex vertical gap={8}>
                    <KeyValueVertical
                        label={i18.deployment.deploymentDetails.contract}
                        value={
                            <Link to={RouterPaths.contractTemplate(contractTemplateInformation.contract_template_id.toString())} className="gf-underline gf-underline-hover">
                                {contractTemplateInformation.definition.name}
                            </Link>
                        }
                    />
                    <KeyValueVertical label={i18.deployment.deploymentDetails.createdOn} value={createdOnText} />
                    <ContractCanisterIdKeyValue />
                    <ContractURLKeyValue />
                    <KeyValueVertical label={i18.deployment.deploymentDetails.deployedBy} value={<CopyableUIDComponent uid={deployment.deployer.toText()} />} />
                    <ContractOwnerPrincipalKeyValue />
                </Flex>
            </Flex>
        </PanelCard>
    );
};

const ContractCanisterIdKeyValue = () => {
    const {contractCanisterId} = useDeploymentContextSafe();
    if (isNullish(contractCanisterId)) {
        return null;
    }
    const contractCanisterIdText = contractCanisterId.toText();
    return <KeyValueVertical label={i18.deployment.deploymentDetails.contractCanisterId} value={<CopyableUIDComponent uid={contractCanisterIdText} />} />;
};

const ContractURLKeyValue = () => {
    const {buildContractURL} = useConfigDataContext();
    const {contractCanisterId} = useDeploymentContextSafe();
    const contractURL = useMemo(() => {
        if (isNullish(contractCanisterId)) {
            return undefined;
        }
        return buildContractURL(contractCanisterId.toText());
    }, [contractCanisterId, buildContractURL]);
    if (isNullish(contractURL)) {
        return null;
    }
    return <KeyValueVertical label={i18.deployment.deploymentDetails.contractURL} value={<CopyableUIDComponent uid={contractURL} />} />;
};

const ContractOwnerKeyValueWrapper = (props: PropsWithChildren) => {
    const {children} = props;
    return <KeyValueVertical label={i18.deployment.deploymentDetails.contractOwner.title} value={children} />;
};

const ContractOwnerPrincipalKeyValue = () => {
    const {contractActivationDataAvailability, contractActivationStateFeature, fetchNotAvailableData} = useContractStatusContext();

    if (contractActivationDataAvailability.type == 'notApplicable' || contractActivationDataAvailability.type == 'notRequired') {
        return null;
    }

    const {loaded, inProgress} = contractActivationStateFeature.status;
    const isError = contractActivationDataAvailability.type == 'notAvailable';

    if (!loaded || isError) {
        return (
            <ContractOwnerKeyValueWrapper>
                <LoadingAndFailedToLoadValueWrapper loaded={loaded} isError={isError} inProgress={inProgress} action={fetchNotAvailableData} />
            </ContractOwnerKeyValueWrapper>
        );
    }

    if (contractActivationDataAvailability.type == 'available') {
        const {type: activationStateType} = contractActivationDataAvailability.activationState;
        switch (activationStateType) {
            case 'activated': {
                return (
                    <ContractOwnerKeyValueWrapper>
                        <CopyableUIDComponent uid={contractActivationDataAvailability.activationState.owner.toText()} />
                    </ContractOwnerKeyValueWrapper>
                );
            }
            case 'notActivated': {
                return <ContractOwnerKeyValueWrapper>{i18.deployment.deploymentDetails.contractOwner.notSet}</ContractOwnerKeyValueWrapper>;
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

    // Illegal state - we should never reach here.
    return null;
};
