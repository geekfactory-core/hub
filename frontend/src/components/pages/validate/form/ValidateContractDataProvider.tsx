import {nonNullish} from '@dfinity/utils';
import type {ButtonProps} from 'antd';
import {RouterPaths} from 'frontend/src/components/pages/skeleton/Router';
import {ErrorAlert} from 'frontend/src/components/widgets/alert/ErrorAlert';
import {ErrorMessageText} from 'frontend/src/components/widgets/alert/ErrorMessageText';
import {useContractDeployment} from 'frontend/src/context/deployment/useContractDeployment';
import {apiLogger, applicationLogger} from 'frontend/src/context/logger/logger';
import {caughtErrorMessage} from 'frontend/src/context/logger/loggerConstants';
import {i18} from 'frontend/src/i18';
import type {DataAvailability} from 'frontend/src/utils/core/feature/feature';
import {jsonStringify} from 'frontend/src/utils/core/json/json';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {IS_DEBUG_ENABLED} from 'frontend/src/utils/env';
import {createContext, useCallback, useContext, useMemo, type PropsWithChildren, type ReactNode} from 'react';
import {useNavigate} from 'react-router-dom';
import {useValidateContractFormDataContext} from './ValidateContractFormDataProvider';

type ActionAvailability = DataAvailability<{url: string}>;

type Context = {
    okButtonProps: ButtonProps;
    actionErrorPanel: ReactNode;
};

const Context = createContext<Context | undefined>(undefined);
export const useValidateContractDataContext = () => {
    const context = useContext<Context | undefined>(Context);
    if (!context) {
        throw new Error('useValidateContractDataContext must be used within a ValidateContractDataProvider');
    }
    return context;
};

export const ValidateContractDataProvider = (props: PropsWithChildren) => {
    const navigate = useNavigate();
    const {formDataAvailability} = useValidateContractFormDataContext();

    const {feature, fetchDeployment, responseError} = useContractDeployment();
    const actionInProgress = feature.status.inProgress;

    /**
    ==========================================
    Action Availability
    ==========================================
    */

    const actionAvailability: ActionAvailability = useMemo<ActionAvailability>(() => {
        if (formDataAvailability.type != 'available') {
            return {type: 'notAvailable'};
        }
        return {
            type: 'available',
            url: formDataAvailability.url
        };
    }, [formDataAvailability]);

    /**
    ==========================================
    Action
    ==========================================
    */

    const performAction = useCallback(async () => {
        const logMessagePrefix = 'validateContract:';
        try {
            if (actionAvailability.type != 'available') {
                return;
            }
            const response = await fetchDeployment([{deploymentCanisterURL: actionAvailability.url}], {
                logger: apiLogger,
                logMessagePrefix
            });
            if (hasProperty(response, 'Ok')) {
                const {contract_template_id, deployment_id} = response.Ok.deployment;
                navigate(RouterPaths.deployment(contract_template_id.toString(), deployment_id.toString()));
                return;
            }
        } catch (e) {
            applicationLogger.error(caughtErrorMessage(logMessagePrefix), e);
        }
    }, [actionAvailability, fetchDeployment, navigate]);

    /**
    ==========================================
    Button props
    ==========================================
    */

    const okButtonProps: ButtonProps = useMemo(() => {
        const result: ButtonProps = {};
        result.children = i18.validateContract.form.validateButton;
        result.disabled = actionInProgress || actionAvailability.type != 'available';
        result.loading = actionInProgress;
        result.onClick = async () => {
            await performAction();
        };
        return result;
    }, [actionAvailability.type, actionInProgress, performAction]);

    /**
    ==========================================
    Action error panel
    ==========================================
    */

    const actionErrorPanel: ReactNode = useMemo(() => {
        if (feature.error.isError) {
            const message = <ErrorMessageText message={i18.common.error.unableTo} errorDebugContext={IS_DEBUG_ENABLED ? feature.error.error?.message : undefined} />;
            return <ErrorAlert message={message} />;
        } else if (nonNullish(responseError)) {
            const message = <ErrorMessageText message={i18.validateContract.stub.error} errorDebugContext={IS_DEBUG_ENABLED ? jsonStringify(responseError) : undefined} />;
            return <ErrorAlert message={message} />;
        }
    }, [feature, responseError]);

    const value = useMemo<Context>(() => {
        return {
            okButtonProps,
            actionErrorPanel
        };
    }, [okButtonProps, actionErrorPanel]);

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};
