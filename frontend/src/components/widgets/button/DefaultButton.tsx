import {Button, type ButtonProps} from 'antd';

export const DefaultButton = (props: Omit<ButtonProps, 'type'>) => {
    return <Button {...props} type="default" />;
};
