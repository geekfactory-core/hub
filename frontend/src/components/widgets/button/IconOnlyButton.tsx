import {Button, type ButtonProps} from 'antd';

export const IconOnlyButton = (props: Omit<ButtonProps, 'children'>) => {
    return <Button {...props} />;
};
