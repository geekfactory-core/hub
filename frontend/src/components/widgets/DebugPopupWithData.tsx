import {QuestionCircleOutlined} from '@ant-design/icons';
import {Flex} from 'antd';
import type {TooltipPlacement} from 'antd/es/tooltip/index';
import {jsonStringify} from 'frontend/src/utils/core/json/json';
import {useMemo, type ReactNode} from 'react';
import {AbstractPopover} from './AbstractPopover';
import {DebugJsonCollapseContent} from './DebugJsonCollapseContent';
import {CopyButton} from './form/CopyButton';

type Props = {
    data: any;
    title?: ReactNode;
    placement?: TooltipPlacement;
};

export const DebugPopupWithData = (props: Props) => {
    const {data, title, placement} = props;

    const content = (
        <div
            style={{
                fontSize: 10,
                overflow: 'auto',
                maxHeight: 400,
                maxWidth: 400
            }}>
            <DebugJsonCollapseContent data={data} />
        </div>
    );

    const copyButton: ReactNode = useMemo(() => {
        return <CopyButton text={() => jsonStringify(data, undefined, {serializeError: true})} size="small" type="text" />;
    }, [data]);

    return (
        <AbstractPopover
            title={
                <Flex gap={8} justify="space-between">
                    {title}
                    {copyButton}
                </Flex>
            }
            content={content}
            placement={placement}
            body={<QuestionCircleOutlined style={{fontSize: 10}} />}
        />
    );
};
