import {Modal} from 'antd';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import PubSub from 'pubsub-js';
import {useCallback, useEffect, useState} from 'react';
import {DEFAULT_MODAL_PROPS} from '../../widgets/modalUtils';
import {ConnectModal} from './modal/ConnectModal';
import {ConnectModalDataProvider} from './modal/ConnectModalDataProvider';

const OPEN_CONNECT_MODAL = 'OPEN_CONNECT_MODAL';

export const ConnectModalRenderer = () => {
    const {isAuthenticated} = useAuthContext();

    if (isAuthenticated) {
        return null;
    }

    return <Content />;
};

const Content = () => {
    const [open, setOpen] = useState<boolean>(false);

    const onCancelModal = useCallback(() => {
        setOpen(false);
    }, []);

    useEffect(() => {
        const token = PubSub.subscribe(OPEN_CONNECT_MODAL, () => {
            setOpen(true);
        });
        return () => {
            PubSub.unsubscribe(token);
        };
    }, []);

    return (
        <Modal open={open} onCancel={onCancelModal} {...DEFAULT_MODAL_PROPS}>
            <ConnectModalDataProvider onCancelModal={onCancelModal}>
                <ConnectModal />
            </ConnectModalDataProvider>
        </Modal>
    );
};

export const sendOpenConnectModalNotification = () => {
    PubSub.publish(OPEN_CONNECT_MODAL);
};
