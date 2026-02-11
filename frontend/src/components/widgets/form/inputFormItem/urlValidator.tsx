import {isNullish} from '@dfinity/utils';
import {i18} from 'frontend/src/i18';
import {trimIfDefined} from 'frontend/src/utils/core/string/string';
import type {InputFormItemState} from './InputFormItem';
import type {ValidationStatus} from './inputFormItemUtils';

export type URLValidationStatus = ValidationStatus<{url: string}, InputFormItemState & {validatedInputValue: string | undefined}>;

export const validateURL = (raw: string | undefined): URLValidationStatus => {
    const input = trimIfDefined(raw);
    if (isNullish(input)) {
        return {type: 'invalid', validatedInputValue: undefined};
    }
    if (URL.canParse(input)) {
        return {type: 'valid', url: input};
    }
    return {
        type: 'invalid',
        status: 'error',
        error: i18.validateContract.form.inputInvalidURL,
        validatedInputValue: input
    };
};
