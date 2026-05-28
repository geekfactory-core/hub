import {AlertActionButton} from 'frontend/src/components/widgets/alert/AlertActionButton';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {useContractBlockStatusContext} from 'frontend/src/context/contractBlock/ContractBlockStatusProvider';
import {i18} from 'frontend/src/i18';

export const ContractBlockStatusLoadingErrorPage = () => {
    const {feature, fetchCurrentContractBlockStatus} = useContractBlockStatusContext();

    return <ErrorAlertWithAction message={i18.deployment.stub.error} action={<AlertActionButton onClick={fetchCurrentContractBlockStatus} loading={feature.status.inProgress} />} large />;
};
