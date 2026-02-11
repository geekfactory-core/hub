import {CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, LoadingOutlined, SettingOutlined, StopOutlined, SyncOutlined, WarningOutlined} from '@ant-design/icons';
import {Result} from 'antd';
import {applicationLogger} from 'frontend/src/context/logger/logger';
import {exhaustiveCheckFailedMessage} from 'frontend/src/context/logger/loggerConstants';
import {type ReactNode} from 'react';
import {getRotateAnimationStyleValue} from '../LoadingIconWithProgress';
import {PanelCard} from '../PanelCard';

type IconType = 'loading' | 'reload' | 'stop' | 'settings' | 'warning' | 'info' | 'success' | 'error';
type Props = {
    prefix?: ReactNode;
    icon: IconType;
    title?: ReactNode;
    subTitle?: ReactNode;
    extra?: ReactNode;
};
export const AbstractStubPage = (props: Props) => {
    return (
        <PanelCard>
            {props.prefix}
            <AbstractStubContent {...props} />
        </PanelCard>
    );
};

const AbstractStubContent = (props: Props) => {
    return <Result icon={<Icon icon={props.icon} />} title={props.title} subTitle={props.subTitle} extra={props.extra} />;
};

const Icon = (props: Pick<Props, 'icon'>) => {
    switch (props.icon) {
        case 'loading':
            return <LoadingOutlined />;
        case 'stop':
            return <StopOutlined />;
        case 'reload':
            return <SyncOutlined style={{animation: getRotateAnimationStyleValue(3)}} />;
        case 'settings':
            return <SettingOutlined style={{animation: getRotateAnimationStyleValue(3)}} />;
        case 'warning':
            return <WarningOutlined />;
        case 'info':
            return <InfoCircleOutlined />;
        case 'success':
            return <CheckCircleOutlined />;
        case 'error':
            return <CloseCircleOutlined />;
        default: {
            const exhaustiveCheck: never = props.icon;
            applicationLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
            return null;
        }
    }
};
