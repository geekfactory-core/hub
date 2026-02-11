import {Button, type ButtonProps} from 'antd';

export const TextButton = (props: Omit<ButtonProps, 'type'>) => {
    return <Button {...props} type="text" />;
};
