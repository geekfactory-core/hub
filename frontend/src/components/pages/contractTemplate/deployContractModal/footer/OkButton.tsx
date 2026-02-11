import {ModalButton} from 'frontend/src/components/widgets/button/ModalButton';
import {useDeployContractModalDataContext} from '../DeployContractModalDataProvider';

export const OkButton = () => {
    const {okButtonProps} = useDeployContractModalDataContext();
    return <ModalButton {...okButtonProps} type="primary" />;
};
