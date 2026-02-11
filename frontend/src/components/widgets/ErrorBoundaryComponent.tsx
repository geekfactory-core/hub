import {WarningOutlined} from '@ant-design/icons';
import {Modal} from 'antd';
import {toError} from 'frontend/src/utils/core/error/toError';
import {IS_DEBUG_ENABLED} from 'frontend/src/utils/env';
import type {Logger} from 'frontend/src/utils/logger/Logger';
import type {ErrorInfo, PropsWithChildren} from 'react';
import {useCallback} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import {DefaultButton} from './button/DefaultButton';
import {PrimaryButton} from './button/PrimaryButton';

const ErrorFallback = ({error, resetErrorBoundary}: {error: Error; resetErrorBoundary: () => void}) => {
    const [errorModal, errorModalContextHolder] = Modal.useModal();
    if (IS_DEBUG_ENABLED) {
        const onClick = () => {
            errorModal.confirm({
                title: 'Rendering error',
                content: (
                    <div className="gf-preWrap gf-font-size-small">
                        <pre>{error.stack}</pre>
                    </div>
                ),
                okText: 'Reset Error Boundary',
                onOk: resetErrorBoundary,
                centered: true,
                icon: null,
                width: '80%',
                okButtonProps: {className: 'gf-flex-auto'},
                cancelButtonProps: {className: 'gf-flex-auto'},
                autoFocusButton: null,
                closable: false,
                maskClosable: false,
                keyboard: false
            });
        };
        return (
            <>
                <div>
                    <PrimaryButton onClick={onClick} icon={<WarningOutlined />} danger>
                        Rendering error...
                    </PrimaryButton>
                </div>
                {errorModalContextHolder}
            </>
        );
    }
    return (
        <div>
            <DefaultButton onClick={resetErrorBoundary} icon={<WarningOutlined />}>
                Rendering error...
            </DefaultButton>
        </div>
    );
};

type Props = {
    childComponentName: string;
    logger?: Logger;
};

export const ErrorBoundaryComponent = (props: PropsWithChildren<Props>) => {
    const {childComponentName, logger} = props;
    const errorHandler = useCallback(
        (error: Error, info: ErrorInfo) => {
            logger?.error(`ErrorBoundaryComponent[${childComponentName}]: `, {info}, toError(error));
        },
        [childComponentName, logger]
    );
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback} onError={errorHandler}>
            {props.children}
        </ErrorBoundary>
    );
};
