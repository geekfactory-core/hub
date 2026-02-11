import {i18} from 'frontend/src/i18';
import {useCallback, type ReactNode} from 'react';
import {DefaultButton} from '../button/DefaultButton';

type Props = {
    loading?: boolean;
    onClick?: () => void;
    label?: ReactNode;
};
export const AlertActionButton = (props: Props) => {
    const {loading, onClick, label = i18.common.button.retryButton} = props;

    const callback = useCallback(() => {
        onClick?.();
    }, [onClick]);

    return (
        <DefaultButton onClick={callback} loading={loading} disabled={loading} block>
            {label}
        </DefaultButton>
    );
};
