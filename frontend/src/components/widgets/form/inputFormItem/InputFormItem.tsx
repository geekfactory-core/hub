import type {InputProps} from 'antd';
import {type ReactNode} from 'react';

export type InputFormItemState = Pick<InputProps, 'status'> & {
    error?: ReactNode;
};
