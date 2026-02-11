import type {PaginationConfig} from 'antd/es/pagination/index';
import {useMemo} from 'react';
import {DEFAULT_PAGINATION_CONFIG} from '../components/widgets/pagination/paginationUtils';

type DefaultPagination = Omit<PaginationConfig, 'position'>;

export const useDefaultPaginationConfig = (override?: Partial<DefaultPagination>) => {
    return useMemo<DefaultPagination>(() => {
        return {
            ...DEFAULT_PAGINATION_CONFIG,
            ...override
        };
    }, [override]);
};
