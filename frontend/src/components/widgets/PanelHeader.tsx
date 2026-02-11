import {isNullish} from '@dfinity/utils';
import {Flex, Typography} from 'antd';
import type {TitleProps} from 'antd/lib/typography/Title';
import {type ReactNode, useMemo} from 'react';

type Props = {
    title: ReactNode;
    titleLevel?: TitleProps['level'];
    description?: ReactNode;
    danger?: boolean;
};

export const PanelHeader = (props: Props) => {
    const {title, titleLevel = 4, description, danger} = props;

    const className = useMemo(() => {
        return danger ? 'gf-ant-color-error' : undefined;
    }, [danger]);

    if (isNullish(description)) {
        return (
            <Typography.Title level={titleLevel} className={className}>
                {title}
            </Typography.Title>
        );
    } else {
        return (
            <Flex vertical gap={8}>
                <Typography.Title level={titleLevel} className={className}>
                    {props.title}
                </Typography.Title>
                {description}
            </Flex>
        );
    }
};
