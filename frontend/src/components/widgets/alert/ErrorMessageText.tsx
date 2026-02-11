import {Flex} from 'antd';
import {IS_DEBUG_ENABLED} from 'frontend/src/utils/env';
import type {ReactNode} from 'react';
import {QuestionPopover} from '../QuestionPopover';

export const ErrorMessageText = (props: {message: ReactNode; errorDebugContext?: ReactNode}) => {
    if (IS_DEBUG_ENABLED) {
        return (
            <Flex gap={8}>
                <div>{props.message}</div>
                <QuestionPopover title="Error" content={props.errorDebugContext} />
            </Flex>
        );
    }
    return props.message;
};
