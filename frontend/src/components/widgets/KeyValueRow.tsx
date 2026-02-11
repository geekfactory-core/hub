import {Flex} from 'antd';
import type {CSSProperties, ReactNode} from 'react';

export type KeyValueRowProps = {
    label: ReactNode;
    value: ReactNode;
    vertical?: boolean;
    wrap?: boolean;
    gap?: number;
    justify?: CSSProperties['justifyContent'];
    align?: CSSProperties['alignItems'];
    labelClassName?: string;
    valueClassName?: string;
};
export const KeyValueRow = (props: KeyValueRowProps) => {
    const {label, value, vertical = false, wrap, gap, justify, align, labelClassName = 'gf-ant-color-secondary', valueClassName} = props;
    return (
        <Flex justify={justify} align={align} vertical={vertical} wrap={wrap} gap={gap}>
            <div className={labelClassName}>{label}</div>
            <div className={valueClassName}>{value}</div>
        </Flex>
    );
};
