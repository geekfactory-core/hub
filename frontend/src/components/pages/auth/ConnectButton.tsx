import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {i18} from 'frontend/src/i18';
import {PrimaryButton} from '../../widgets/button/PrimaryButton';
import {sendOpenConnectModalNotification} from './ConnectModalRenderer';

export const ConnectButton = () => {
    const {isAuthenticated, isAuthenticating} = useAuthContext();
    const disabled = isAuthenticating;
    if (isAuthenticated) {
        return null;
    }
    return (
        <PrimaryButton onClick={sendOpenConnectModalNotification} disabled={disabled} loading={isAuthenticating}>
            {i18.auth.connect.connectButton}
        </PrimaryButton>
    );
};
