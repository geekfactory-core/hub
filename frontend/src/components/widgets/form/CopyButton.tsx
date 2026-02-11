import {CheckOutlined, CopyOutlined} from '@ant-design/icons';
import type {ButtonType} from 'antd/es/button';
import type {SizeType} from 'antd/es/config-provider/SizeContext';
import copy from 'copy-to-clipboard';
import {delayPromise} from 'frontend/src/utils/core/promise/promiseUtils';
import {useCallback, useState} from 'react';
import {IconOnlyButton} from '../button/IconOnlyButton';

export const CopyButton = ({
    text,
    disabled,
    className,
    size = 'large',
    type = 'default'
}: {
    text: string | (() => string);
    disabled?: boolean;
    className?: string;
    size?: SizeType;
    type?: ButtonType;
}) => {
    const [icon, setIcon] = useState(<CopyOutlined />);

    const onClick = useCallback(async () => {
        const value = typeof text === 'function' ? text() : text;
        copy(value);
        setIcon(<CheckOutlined />);
        await delayPromise(2000);
        setIcon(<CopyOutlined />);
    }, [text]);

    return <IconOnlyButton onClick={onClick} icon={icon} size={size} disabled={disabled} className={className} type={type} />;
};
