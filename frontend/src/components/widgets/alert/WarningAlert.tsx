import type {ComponentProps} from 'react';
import {AbstractAlertWithAction} from './AbstractAlertWithAction';

export const WarningAlert = (props: Omit<ComponentProps<typeof AbstractAlertWithAction>, 'type' | 'action'>) => {
    return <AbstractAlertWithAction {...props} type="warning" />;
};
