import {CopyOutlined} from '@ant-design/icons';
import {Typography} from 'antd';
import type {CopyConfig} from 'antd/es/typography/Base/index';
import type {Property} from 'csstype';
import {truncateEnd, truncateMiddle} from 'frontend/src/utils/core/string/truncate';
import {useMemo, type ReactNode} from 'react';

export type UIDComponentProps = {
    uid: string;
    label?: ReactNode;
    truncateLength?: number;
    copyable?: boolean;
    color?: string;
    copyButtonColor?: string;
    fromEnd?: boolean;
    className?: string;
    code?: boolean;
    wordBreak?: Property.WordBreak;
    fontSize?: Property.FontSize;
    fontWeight?: Property.FontWeight;
    noWrap?: boolean;
    showTitle?: boolean;
};

export const UIDComponent = (props: UIDComponentProps) => {
    const {uid, showTitle = true} = props;
    const copyable: CopyConfig | undefined = useMemo(() => {
        if (!props.copyable) {
            return undefined;
        }
        const icon = <CopyOutlined style={{color: props.copyButtonColor ?? props.color}} />;
        return {
            text: uid,
            tooltips: false,
            icon: [icon, undefined]
        };
    }, [props.copyable, uid, props.copyButtonColor, props.color]);
    const style = {
        wordBreak: props.wordBreak,
        whiteSpace: props.noWrap ? 'nowrap' : undefined,
        color: props.color,
        fontWeight: props.fontWeight ?? 'normal',
        fontSize: props.fontSize
    };
    const length = props.truncateLength || 64;
    const label = props.label ?? (props.fromEnd ? truncateEnd(uid, length) : truncateMiddle(uid, length));
    const title = showTitle ? uid : undefined;
    return (
        <Typography.Text code={props.code} className={props.className} copyable={copyable} style={style} title={title}>
            {label}
        </Typography.Text>
    );
};
