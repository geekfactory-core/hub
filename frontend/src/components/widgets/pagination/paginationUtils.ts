import type {PaginationConfig} from 'antd/es/pagination/index';
import {PAGE_SIZE} from 'frontend/src/constants';

export const DEFAULT_PAGINATION_CONFIG: PaginationConfig & {
    defaultPageSize: number;
    defaultCurrent: number;
} = {
    size: 'small',
    showLessItems: true,
    hideOnSinglePage: true,
    defaultPageSize: PAGE_SIZE.DEFAULT,
    defaultCurrent: 1,
    showSizeChanger: false,
    className: 'gf-noWrap'
};
