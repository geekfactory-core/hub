import {CheckCircleOutlined, CloseCircleOutlined} from '@ant-design/icons';
import {isNullish} from '@dfinity/utils';
import {Flex, Steps, type StepProps} from 'antd';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {LoadingIconWithProgress} from 'frontend/src/components/widgets/LoadingIconWithProgress';
import {useDeploymentProcessorContext} from 'frontend/src/context/deployment/DeploymentProcessor';
import {useDeploymentContextSafe} from 'frontend/src/context/deployment/DeploymentProvider';
import {useDeploymentStateContext, type DeploymentStateUnion} from 'frontend/src/context/deployment/DeploymentStateProvider';
import {applicationLogger} from 'frontend/src/context/logger/logger';
import {exhaustiveCheckFailedMessage} from 'frontend/src/context/logger/loggerConstants';
import {i18} from 'frontend/src/i18';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {useMemo} from 'react';
import {isDeploymentFinalizedWithAnyResult, isFinalizeDeploymentSubStateFinalized} from '../../../../../context/deployment/deploymentInformationUtils';
import {CancelDeploymentButton} from './CancelDeploymentButton';
import {ProcessManuallyButton} from './ProcessManuallyButton';

export const DeploymentProgressSteps = () => {
    const {deployment} = useDeploymentContextSafe();
    const {state} = useDeploymentStateContext();
    const {shouldProcessManually} = useDeploymentProcessorContext();

    const deploymentFinalizedWithAnyResult = useMemo(() => isDeploymentFinalizedWithAnyResult(deployment?.state), [deployment?.state]);

    const stepContext: StepContext = useMemo(() => getStepContextFrom(state, shouldProcessManually), [state, shouldProcessManually]);

    if (deploymentFinalizedWithAnyResult) {
        return null;
    }

    return <Steps current={stepContext.current} items={stepContext.items} labelPlacement="vertical" direction="vertical" />;
};

type StepContext = {
    current: number;
    items: Array<StepProps>;
};

const getStepContextFrom = (state: DeploymentStateUnion | undefined, shouldProcessManually: boolean): StepContext => {
    let current = -1;
    const items: Array<StepProps> = [
        {title: i18.deployment.contractDeployment.progressSteps.transferICP, status: undefined},
        {title: i18.deployment.contractDeployment.progressSteps.mintingCycles, status: undefined},
        {title: i18.deployment.contractDeployment.progressSteps.createContractCanister, status: undefined},
        {title: i18.deployment.contractDeployment.progressSteps.generateCertificate, status: undefined},
        {
            title: i18.deployment.contractDeployment.progressSteps.deployingContractCanister,
            status: undefined
        },
        {
            title: i18.deployment.contractDeployment.progressSteps.removingControllersFromContractCanister,
            status: undefined
        },
        {title: i18.deployment.contractDeployment.progressSteps.finalizeDeployment, status: 'wait'}
    ];
    if (isNullish(state)) {
        current = 0;
        items[current].icon = <LoadingIconWithProgress percent={20} />;
    } else {
        const {type: stateType} = state;
        switch (stateType) {
            case 'StartDeployment':
            case 'TransferDeployerFundsToTransitAccount':
            case 'TransferTopUpFundsToCMC': {
                current = 0;
                let percent = 25;
                if (stateType == 'TransferDeployerFundsToTransitAccount') {
                    percent = 50;
                } else if (stateType == 'TransferTopUpFundsToCMC') {
                    percent = 75;
                }
                items[current].icon = <LoadingIconWithProgress percent={percent} />;
                break;
            }
            case 'NotifyCMCTopUp': {
                current = 1;
                items[current].icon = <LoadingIconWithProgress />;
                break;
            }
            case 'CreateContractCanisterOverCMC':
            case 'CreateContractCanisterOverManagement': {
                current = 2;
                items[current].icon = <LoadingIconWithProgress />;
                break;
            }
            case 'GenerateContractCertificate':
            case 'WaitingReceiveContractCertificate': {
                current = 3;
                const percent = stateType == 'GenerateContractCertificate' ? 35 : 75;
                items[current].icon = <LoadingIconWithProgress percent={percent} />;
                break;
            }
            case 'StartInstallContractWasm':
            case 'UploadContractWasm':
            case 'InstallContractWasm': {
                current = 4;
                let percent = 20;
                if (stateType == 'UploadContractWasm') {
                    const totalNumberOfChunks = Number(state.state.upload_chunk_count);
                    const numberOfUploadedChunks = state.state.uploaded_chunk_hashes.length;
                    //calculate percent from 20 to 85
                    percent = 20 + Math.floor((numberOfUploadedChunks / totalNumberOfChunks) * 65);
                } else if (stateType == 'InstallContractWasm') {
                    percent = 90;
                }
                items[current].icon = <LoadingIconWithProgress percent={percent} />;
                break;
            }
            case 'MakeContractSelfControlled': {
                current = 5;
                items[current].icon = <LoadingIconWithProgress />;
                break;
            }
            case 'FinalizeDeployment': {
                current = 6;
                if (!isFinalizeDeploymentSubStateFinalized(state.state.sub_state)) {
                    const percent = hasProperty(state.state.sub_state, 'TransferTransitFundsToExternalService') ? 35 : 75;
                    items[current].icon = <LoadingIconWithProgress percent={percent} />;
                }
                break;
            }
            default: {
                const exhaustiveCheck: never = stateType;
                applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
            }
        }
    }

    for (let i = 0; i < current; i++) {
        items[i].icon = <CheckCircleOutlined style={{fontSize: 32, color: 'green'}} />;
    }

    if (shouldProcessManually) {
        items[current].icon = <CloseCircleOutlined style={{fontSize: 32, color: 'red'}} />;
        items[current].description = (
            <ErrorAlertWithAction
                action={
                    <Flex vertical gap={8}>
                        <ProcessManuallyButton />
                        <CancelDeploymentButton />
                    </Flex>
                }
                message={i18.common.error.unableTo}
                style={{marginTop: 5}}
            />
        );
    }
    return {current, items};
};
