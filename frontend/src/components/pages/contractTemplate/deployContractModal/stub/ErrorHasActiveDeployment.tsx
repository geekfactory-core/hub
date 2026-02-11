import {ErrorAlert} from 'frontend/src/components/widgets/alert/ErrorAlert';
import {i18} from 'frontend/src/i18';

export const ErrorHasActiveDeployment = () => <ErrorAlert message={i18.contractTemplate.deployModal.stub.activeDeploymentExists} />;
