import {ModalButton} from 'frontend/src/components/widgets/button/ModalButton';
import {useConnectModalDataDataContext} from '../ConnectModalDataProvider';

export const OkButton = () => {
    const {okButtonProps} = useConnectModalDataDataContext();
    return <ModalButton {...okButtonProps} type="primary" />;
};
