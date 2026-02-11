import {QuestionCircleOutlined} from '@ant-design/icons';
import {Popover} from 'antd';
import type {SizeType} from 'antd/lib/config-provider/SizeContext';
import type {TooltipPlacement} from 'antd/lib/tooltip';
import type {TooltipProps as RcTooltipProps} from 'rc-tooltip/lib/Tooltip';
import type {MouseEvent, ReactNode} from 'react';
import {useCallback} from 'react';
import {IconOnlyButton} from './button/IconOnlyButton';

type Props = {
    body?: ReactNode;
    content: ReactNode;
    title?: ReactNode;
    placement?: TooltipPlacement;
    iconColor?: string;
    iconFontSize?: number;
    buttonSize?: SizeType;
    icon?: ReactNode;
    onOpenChange?: RcTooltipProps['onVisibleChange'];
    trigger?: 'click' | 'hover';
    popoverColor?: string;
    disablePreventDefault?: boolean;
    defaultOpen?: boolean;
};

export const AbstractPopover = (props: Props) => {
    const onClick = useCallback(
        (e: MouseEvent) => {
            e.stopPropagation();
            if (props.disablePreventDefault != true) {
                e.preventDefault();
            }
            return false;
        },
        [props.disablePreventDefault]
    );
    return (
        <span onClick={onClick}>
            <Popover
                title={props.title}
                defaultOpen={props.defaultOpen}
                placement={props.placement ?? 'rightTop'}
                content={props.content}
                trigger={[props.trigger ?? 'click']}
                color={props.popoverColor}
                destroyOnHidden={true}
                onOpenChange={props.onOpenChange}>
                {props.body ?? (
                    <IconOnlyButton shape="circle" icon={props.icon ?? <QuestionCircleOutlined style={{color: props.iconColor, fontSize: props.iconFontSize}} />} type="text" size={props.buttonSize} />
                )}
            </Popover>
        </span>
    );
};
