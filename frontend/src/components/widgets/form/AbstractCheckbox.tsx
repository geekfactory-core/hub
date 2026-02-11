import {Checkbox} from 'antd';
import {type MouseEvent, type PropsWithChildren, useCallback} from 'react';

type Props = {
    onClick?: () => void;
    checked: boolean;
    disabled?: boolean;
};
export const AbstractCheckbox = ({onClick, checked, disabled, children}: PropsWithChildren<Props>) => {
    const onClickCheckbox = useCallback(
        (event: MouseEvent<HTMLElement>) => {
            event.stopPropagation();
            event.preventDefault();
            onClick?.();
            return false;
        },
        [onClick]
    );
    return (
        <Checkbox checked={checked} onClick={onClickCheckbox} disabled={disabled}>
            {children}
        </Checkbox>
    );
};
