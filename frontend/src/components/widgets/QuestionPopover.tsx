import {QuestionCircleOutlined} from '@ant-design/icons';
import type {TooltipPlacement} from 'antd/es/tooltip/index';
import type {ReactNode} from 'react';
import {AbstractPopover} from './AbstractPopover';

type Props = {
    title?: ReactNode;
    content: ReactNode;
    placement?: TooltipPlacement;
};

export const QuestionPopover = (props: Props) => {
    const {title, content, placement = 'top'} = props;
    return (
        <AbstractPopover
            title={title}
            content={
                <div style={{maxWidth: 400}} className="gf-preWrap">
                    {content}
                </div>
            }
            placement={placement}
            body={<QuestionCircleOutlined />}
        />
    );
};
