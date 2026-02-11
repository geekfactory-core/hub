import {type ComponentProps, type ReactNode} from 'react';
import {AbstractAlertWithAction} from './AbstractAlertWithAction';

export const ErrorAlertWithAction = (props: Omit<ComponentProps<typeof AbstractAlertWithAction>, 'type'> & {action: ReactNode}) => {
    return <AbstractAlertWithAction {...props} type="error" className="gf-antd-alert-with-action" />;
};
