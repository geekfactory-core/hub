import {ReloadOutlined} from '@ant-design/icons';
import {type ButtonProps} from 'antd';
import {IconOnlyButton} from './IconOnlyButton';

export const ReloadIconButton = (props: Omit<ButtonProps, 'children' | 'icon'>) => {
    return <IconOnlyButton {...props} icon={<ReloadOutlined />} />;
};
