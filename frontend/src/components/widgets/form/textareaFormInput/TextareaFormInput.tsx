import {Form, Input, type FormItemProps, type InputProps} from 'antd';
import {useCallback, type ChangeEvent, type ReactNode} from 'react';

type TextareaFormItemState = Pick<InputProps, 'status'> & {
    error?: ReactNode;
};

type Props = TextareaFormItemState &
    Pick<InputProps, 'placeholder' | 'disabled' | 'readOnly' | 'inputMode' | 'style'> &
    Pick<FormItemProps, 'noStyle'> & {
        value: string | undefined;
        setValue?: (value: string | undefined) => void;
        label?: ReactNode;
        onBlur?: () => void;
        formItemClassName?: string;
        maxLength?: number;
    };

export const TextareaFormItem = ({value, setValue, label, onBlur, error, status, placeholder, disabled, readOnly, inputMode, style, noStyle, formItemClassName, maxLength}: Props) => {
    const onChange = useCallback(
        (event: ChangeEvent<HTMLTextAreaElement>) => {
            const raw = event.target.value;
            setValue?.(raw);
        },
        [setValue]
    );

    return (
        <Form.Item label={label} validateStatus={status} help={error} layout="vertical" noStyle={noStyle} className={formItemClassName}>
            <Input.TextArea
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                inputMode={inputMode}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-1p-ignore
                style={style}
                autoSize
                maxLength={maxLength}
            />
        </Form.Item>
    );
};
