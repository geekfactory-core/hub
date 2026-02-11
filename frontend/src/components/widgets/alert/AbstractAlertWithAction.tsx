import type {AlertProps} from 'antd';
import {Alert} from 'antd';
import {mergeClassName} from 'frontend/src/utils/core/dom/domUtils';
import {useMemo} from 'react';

export const AbstractAlertWithAction = (props: Omit<AlertProps, 'showIcon'> & {large?: boolean}) => {
    const className = useMemo(() => {
        return mergeClassName(props.className, props.large ? 'gf-antd-alert-lg' : undefined);
    }, [props.className, props.large]);
    return <Alert {...props} showIcon={false} className={className} />;
};
