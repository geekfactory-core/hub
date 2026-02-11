import type {CardProps} from 'antd';
import {Card} from 'antd';
import type {PropsWithChildren} from 'react';

export const PanelCard = (props: PropsWithChildren<CardProps>) => {
    return <Card {...props}>{props.children}</Card>;
};
