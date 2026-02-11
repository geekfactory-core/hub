import {Flex} from 'antd';
import {KeyValueVertical} from 'frontend/src/components/widgets/KeyValueVertical';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {CopyableUIDComponent} from 'frontend/src/components/widgets/uid/CopyableUIDComponent';
import {i18} from 'frontend/src/i18';
import type {ContractCertificate} from 'src/declarations/hub/hub.did';
import {useContractStatusContext} from '../../context/ContractStatusProvider';
import {CertificateExpirationDate} from './CertificateExpirationDate';

export const CertificateDetailsPanel = () => {
    const {contractDeploymentState, contractValidationDataAvailability} = useContractStatusContext();

    if (
        contractDeploymentState?.type == 'success' &&
        contractValidationDataAvailability.type == 'available' &&
        contractValidationDataAvailability.validationState.type == 'certificateValidAndActive'
    ) {
        const {
            certificate: {contract_certificate}
        } = contractValidationDataAvailability.validationState;
        return <Content contractCertificate={contract_certificate} contractCanisterId={contractDeploymentState.contractCanisterId} />;
    }
    return null;
};

const Content = ({contractCertificate, contractCanisterId}: {contractCertificate: ContractCertificate; contractCanisterId: string}) => {
    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <PanelHeader title={i18.validateContract.certificateDetails.panelTitle} />
                <Flex vertical gap={8}>
                    <KeyValueVertical label={i18.validateContract.certificateDetails.expirationDate} value={<CertificateExpirationDate expiration={contractCertificate.expiration} />} />
                    <KeyValueVertical label={i18.validateContract.certificateDetails.contractCanisterId} value={<CopyableUIDComponent uid={contractCanisterId} />} />
                    <KeyValueVertical label={i18.validateContract.certificateDetails.hubCanisterId} value={<CopyableUIDComponent uid={contractCertificate.hub_canister.toText()} />} />
                    <KeyValueVertical label={i18.validateContract.certificateDetails.deployedBy} value={<CopyableUIDComponent uid={contractCertificate.deployer.toText()} />} />
                    <KeyValueVertical label={i18.validateContract.certificateDetails.contractWasmHash} value={<CopyableUIDComponent uid={contractCertificate.contract_wasm_hash} />} />
                    <KeyValueVertical label={i18.validateContract.certificateDetails.contractTemplateId} value={contractCertificate.contract_template_id.toString()} />
                </Flex>
            </Flex>
        </PanelCard>
    );
};
