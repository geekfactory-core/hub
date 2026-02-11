import {AlertActionButton} from 'frontend/src/components/widgets/alert/AlertActionButton';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {useContractTemplateContext} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import {i18} from 'frontend/src/i18';
import {memo} from 'react';

export const ContractTemplateLoadingErrorPage = memo(() => {
    const {fetchContractTemplateInformation, feature} = useContractTemplateContext();
    return <ErrorAlertWithAction message={i18.contractTemplate.stub.error} action={<AlertActionButton onClick={fetchContractTemplateInformation} loading={feature.status.inProgress} />} large />;
});
