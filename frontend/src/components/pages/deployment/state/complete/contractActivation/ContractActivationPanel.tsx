import {ExportOutlined} from '@ant-design/icons';
import {isNullish} from '@dfinity/utils';
import {Flex, Spin, Steps} from 'antd';
import {AlertActionButton} from 'frontend/src/components/widgets/alert/AlertActionButton';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {ExternalLink} from 'frontend/src/components/widgets/ExternalLink';
import {TextAreaReadonlyFormItemRow} from 'frontend/src/components/widgets/form/textareaFormInput/TextAreaReadonlyFormItemRow';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {useContractActivationCode} from 'frontend/src/context/contractTemplate/useContractActivationCode';
import {useDeploymentContextSafe} from 'frontend/src/context/deployment/DeploymentProvider';
import {useConfigDataContext} from 'frontend/src/context/hub/config/ConfigDataProvider';
import {i18} from 'frontend/src/i18';
import {useEffect, useMemo} from 'react';
import {useContractStatusContext} from '../../../context/ContractStatusProvider';
import {DeploymentActivationStateAutoFetcher} from './DeploymentActivationStateAutoFetcher';

export const ContractActivationPanel = () => {
    const {isOwnedByCurrentUser} = useDeploymentContextSafe();
    const {contractDeploymentState, contractActivationDataAvailability} = useContractStatusContext();

    if (!isOwnedByCurrentUser) {
        return null;
    }

    if (isNullish(contractDeploymentState)) {
        // Illegal state - we should never reach here.
        return null;
    }
    if (contractDeploymentState.type != 'success') {
        return null;
    }

    if (contractActivationDataAvailability.type == 'available') {
        if (contractActivationDataAvailability.activationState.type == 'notActivated') {
            return <Content contractCanisterId={contractDeploymentState.contractCanisterId} />;
        }
    }
    return null;
};

type Props = {
    contractCanisterId: string;
};
const Content = ({contractCanisterId}: Props) => {
    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <PanelHeader title={i18.deployment.contractActivation.panelTitle} />
                <ActivationInstructions contractCanisterId={contractCanisterId} />
            </Flex>
        </PanelCard>
    );
};

const ActivationInstructions = ({contractCanisterId}: Props) => {
    const {buildContractURL} = useConfigDataContext();
    const href = useMemo(() => buildContractURL(contractCanisterId), [buildContractURL, contractCanisterId]);

    const marginBottom = 16;

    return (
        <Flex vertical gap={8}>
            <Steps
                direction="vertical"
                progressDot={true}
                items={[
                    {
                        title: <span>{i18.deployment.contractActivation.instructionSteps.copyActivationCode}</span>,
                        description: <InitializeCodeComponent />,
                        status: 'finish'
                    },
                    {
                        title: (
                            <Flex vertical style={{marginBottom}}>
                                <span>{i18.deployment.contractActivation.instructionSteps.openContract}</span>
                                <div>
                                    <ExternalLink href={href} className="gf-underline gf-underline-hover gf-font-size-smaller">
                                        {href}
                                    </ExternalLink>{' '}
                                    <ExportOutlined className="gf-font-size-smaller" />
                                </div>
                            </Flex>
                        ),
                        status: 'finish'
                    },
                    {
                        title: i18.deployment.contractActivation.instructionSteps.finalizeActivation,
                        status: 'finish'
                    }
                ]}
            />
            <DeploymentActivationStateAutoFetcher />
        </Flex>
    );
};

const InitializeCodeComponent = () => {
    const {deployment} = useDeploymentContextSafe();

    const {activationCode, feature, fetchActivationCode} = useContractActivationCode(deployment.deployment_id);
    const {loaded, inProgress} = feature.status;

    useEffect(() => {
        fetchActivationCode();
    }, [fetchActivationCode]);

    if (!loaded) {
        return (
            <div>
                <Spin size="small" />
            </div>
        );
    }

    if (feature.error.isError || isNullish(activationCode)) {
        return <ErrorAlertWithAction message={i18.deployment.contractActivation.stub.activationCode} action={<AlertActionButton onClick={fetchActivationCode} loading={inProgress} />} />;
    }

    return <TextAreaReadonlyFormItemRow value={activationCode} size="large" />;
};
