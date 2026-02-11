import {Button, type ButtonProps} from 'antd';

export const PrimaryButton = (props: Omit<ButtonProps, 'type'>) => {
    return <Button {...props} type="primary" />;
};
