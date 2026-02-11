import {AlertActionButton} from 'frontend/src/components/widgets/alert/AlertActionButton';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {i18} from 'frontend/src/i18';
import {useDeployContractModalDataContext} from '../DeployContractModalDataProvider';

export const ErrorNoContractTemplate = () => {
    const {
        requiredData: {refetchAllRequiredData, refetchAllRequiredDataInProgress}
    } = useDeployContractModalDataContext();

    return <ErrorAlertWithAction message={i18.contractTemplate.stub.error} action={<AlertActionButton onClick={refetchAllRequiredData} loading={refetchAllRequiredDataInProgress} />} />;
};
