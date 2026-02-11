import {ModalButton} from 'frontend/src/components/widgets/button/ModalButton';
import {useDeployContractModalDataContext} from '../DeployContractModalDataProvider';

export const CancelButton = () => {
    const {cancelButtonProps} = useDeployContractModalDataContext();
    return <ModalButton {...cancelButtonProps} />;
};
