import {ModalButton} from 'frontend/src/components/widgets/button/ModalButton';
import {useConnectModalDataDataContext} from '../ConnectModalDataProvider';

export const CancelButton = () => {
    const {cancelButtonProps} = useConnectModalDataDataContext();
    return <ModalButton {...cancelButtonProps} />;
};
