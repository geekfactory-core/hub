import type {ExtractValidStatus} from 'frontend/src/components/widgets/form/inputFormItem/inputFormItemUtils';
import {type URLValidationStatus, validateURL} from 'frontend/src/components/widgets/form/inputFormItem/urlValidator';
import {type DataAvailability, useSimpleReducer} from 'frontend/src/utils/core/feature/feature';
import {createContext, type Dispatch, type PropsWithChildren, useContext, useMemo} from 'react';

type FormState = {
    url?: string;
};

type FormValidationState = {
    url?: URLValidationStatus;
};

type FormDataAvailability = DataAvailability<ExtractValidStatus<URLValidationStatus>>;

type Context = {
    formState: FormState;
    updateFormState: Dispatch<Partial<FormState>>;

    formValidationState: FormValidationState;

    formDataAvailability: FormDataAvailability;
};

const Context = createContext<Context | undefined>(undefined);
export const useValidateContractFormDataContext = () => {
    const context = useContext<Context | undefined>(Context);
    if (!context) {
        throw new Error('useValidateContractFormDataContext must be used within a ValidateContractFormDataProvider');
    }
    return context;
};

export const ValidateContractFormDataProvider = (props: PropsWithChildren) => {
    /**
    ==========================================
    Form State
    ==========================================
    */

    const [formState, updateFormState] = useSimpleReducer<FormState, Partial<FormState>>();

    /**
    ==========================================
    Form Data Validation/Availability
    ==========================================
    */

    const [formValidationState, formDataAvailability] = useMemo<[FormValidationState, FormDataAvailability]>(() => {
        /**
         * validation
         */
        const validatedURL = validateURL(formState.url);
        const formValidationState: FormValidationState = {
            url: validatedURL
        };
        /**
         * availability
         */
        const formDataAvailability: FormDataAvailability =
            validatedURL.type == 'invalid'
                ? {type: 'notAvailable'}
                : {
                      type: 'available',
                      url: validatedURL.url
                  };

        return [formValidationState, formDataAvailability];
    }, [formState.url]);

    const value = useMemo<Context>(() => {
        return {
            formState,
            updateFormState,
            formValidationState,
            formDataAvailability
        };
    }, [formState, updateFormState, formValidationState, formDataAvailability]);

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};
