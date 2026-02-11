import {LoadingOutlined, ReloadOutlined} from '@ant-design/icons';
import {Flex, Spin} from 'antd';
import {i18} from 'frontend/src/i18';
import {useCallback, type ReactNode} from 'react';
import {IconOnlyButton} from '../button/IconOnlyButton';

type Props = {
    children?: ReactNode;

    showRefreshButton?: boolean;
    failedToLoadLabel?: ReactNode;

    loaded: boolean;
    isError: boolean;
    inProgress: boolean;
    action?: () => void;
};
export const LoadingAndFailedToLoadValueWrapper = (props: Props) => {
    const {children, loaded, isError, inProgress, action, failedToLoadLabel = i18.common.error.keyValueFailedToLoad, showRefreshButton = false} = props;

    const onClick = useCallback(() => action?.(), [action]);

    if (!loaded) {
        return <Spin size="small" />;
    }
    if (isError) {
        const icon = inProgress ? <LoadingOutlined /> : <ReloadOutlined />;
        return (
            <Flex gap={8} align="center">
                <span className="gf-ant-color-error">{failedToLoadLabel}</span>
                {showRefreshButton ? <IconOnlyButton icon={icon} type="default" size="small" className="gf-no-padding" onClick={onClick} disabled={inProgress} /> : null}
            </Flex>
        );
    }
    return children;
};
