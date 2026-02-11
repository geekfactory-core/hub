import {TextareaFormItem} from 'frontend/src/components/widgets/form/textareaFormInput/TextareaFormInput';
import {useConfigDataContext} from 'frontend/src/context/hub/config/ConfigDataProvider';
import {i18} from 'frontend/src/i18';
import {useCallback, useMemo} from 'react';
import {useValidateContractFormDataContext} from './ValidateContractFormDataProvider';

export const URLInput = () => {
    const {formState, updateFormState, formValidationState} = useValidateContractFormDataContext();
    const {buildContractURL} = useConfigDataContext();

    const placeholder = useMemo(() => buildContractURL('CANISTER_ID'), [buildContractURL]);

    const setValue = useCallback(
        (value: string | undefined) => {
            updateFormState({url: value});
        },
        [updateFormState]
    );

    return <TextareaFormItem value={formState.url} setValue={setValue} placeholder={placeholder} label={i18.validateContract.form.inputLabel} {...formValidationState.url} />;
};
