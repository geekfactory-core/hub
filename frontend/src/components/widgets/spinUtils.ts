import type {SpinProps} from 'antd';

export const spinLoading = (inProgress: boolean): boolean | SpinProps => {
    return inProgress ? {size: 'small'} : false;
};
