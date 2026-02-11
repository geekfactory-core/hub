import type {ButtonProps} from 'antd';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {sendLoginNotification} from 'frontend/src/context/LoginNotificationHandler';
import {i18} from 'frontend/src/i18';
import {useSimpleReducer, type DataAvailability} from 'frontend/src/utils/core/feature/feature';
import {createContext, useContext, useMemo, type Dispatch, type PropsWithChildren} from 'react';

type FormState = {
    termsOfUseChecked?: boolean;
    howItWorksChecked?: boolean;
};

type ActionAvailability = DataAvailability;

type Context = {
    formState: FormState;
    updateFormState: Dispatch<Partial<FormState>>;

    okButtonProps: ButtonProps;
    cancelButtonProps: ButtonProps;

    formControlsDisabled: boolean;
};

const Context = createContext<Context | undefined>(undefined);
export const useConnectModalDataDataContext = () => {
    const context = useContext<Context | undefined>(Context);
    if (!context) {
        throw new Error('useConnectModalDataContext must be used within a ConnectModalDataProvider');
    }
    return context;
};

type Props = {
    onCancelModal: () => void;
};
export const ConnectModalDataProvider = (props: PropsWithChildren<Props>) => {
    const {onCancelModal} = props;

    const {isAuthenticated, isAuthenticating} = useAuthContext();
    const canConnect = !isAuthenticated;

    /**
    ==========================================
    Form State
    ==========================================
    */
    const [formState, updateFormState] = useSimpleReducer<FormState, Partial<FormState>>();

    /**
    ==========================================
    ActionAvailability
    ==========================================
    */

    const actionAvailability = useMemo<ActionAvailability>(() => {
        if (!canConnect || isAuthenticating || !formState.termsOfUseChecked || !formState.howItWorksChecked) {
            return {type: 'notAvailable'};
        }
        return {type: 'available'};
    }, [canConnect, isAuthenticating, formState.termsOfUseChecked, formState.howItWorksChecked]);

    /**
    ==========================================
    Button props
    ==========================================
    */

    const okButtonProps: ButtonProps = useMemo(() => {
        const result: ButtonProps = {};
        result.className = 'gf-multiline-button';
        result.children = i18.auth.connect.confirmationModal.button;
        result.disabled = actionAvailability.type != 'available';
        result.loading = isAuthenticating;
        result.onClick = async () => {
            sendLoginNotification();
        };
        return result;
    }, [actionAvailability.type, isAuthenticating]);

    const cancelButtonProps: ButtonProps = useMemo(() => {
        const result: ButtonProps = {};
        result.children = i18.common.button.cancelButton;
        result.disabled = isAuthenticating;
        result.onClick = () => {
            onCancelModal();
        };
        return result;
    }, [isAuthenticating, onCancelModal]);

    const formControlsDisabled = isAuthenticating;

    const value = useMemo<Context>(() => {
        return {
            formState,
            updateFormState,

            okButtonProps,
            cancelButtonProps,

            formControlsDisabled
        };
    }, [formState, updateFormState, okButtonProps, cancelButtonProps, formControlsDisabled]);

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};
