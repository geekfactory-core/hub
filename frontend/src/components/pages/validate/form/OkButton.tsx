import {ModalButton} from 'frontend/src/components/widgets/button/ModalButton';
import {useValidateContractDataContext} from './ValidateContractDataProvider';

export const OkButton = () => {
    const {okButtonProps} = useValidateContractDataContext();
    return <ModalButton {...okButtonProps} type="primary" />;
};
