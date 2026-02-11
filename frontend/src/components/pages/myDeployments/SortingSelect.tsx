import {nonNullish} from '@dfinity/utils';
import {Select} from 'antd';
import {getDefaultListSortItem} from 'frontend/src/context/contractTemplate/ContractDeploymentsProvider';
import {useMyDeploymentsProviderContext} from 'frontend/src/context/myDeployments/MyDeploymentsProvider';
import type {DefaultOptionType} from 'rc-select/lib/Select';
import {useMemo} from 'react';
import type {ListSortItem} from '../../../hook/useRemoteListWithUrlState';
import {serializeListSortItem} from '../../../hook/useRemoteListWithUrlState';
import {MY_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED} from './MyDeploymentsEntryPoint';

type OptionType = DefaultOptionType;

export const SortingSelect = (props: {onChange: (value: string) => void; disabled: boolean}) => {
    const {
        listState,
        feature: {
            status: {inProgress}
        }
    } = useMyDeploymentsProviderContext();

    const options: Array<OptionType> = useMemo(() => {
        return [
            {
                label: 'Newest',
                value: serializeListSortItem(getDefaultListSortItem())
            },
            {
                label: 'Oldest',
                value: serializeListSortItem({
                    field: MY_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED,
                    order: 'ascend'
                })
            }
        ];
    }, []);

    const disabled = props.disabled || inProgress;

    const value: string = useMemo(() => {
        const sortingItem: ListSortItem | undefined = listState.sort?.[0];
        const newSortingItem: ListSortItem | undefined = validateListSortItem(sortingItem);
        if (nonNullish(newSortingItem)) {
            return serializeListSortItem(newSortingItem);
        }
        return serializeListSortItem(getDefaultListSortItem());
    }, [listState.sort]);
    return <Select<string> value={value} options={options} popupMatchSelectWidth={false} onChange={props.onChange} disabled={disabled} />;
};

export const validateListSortItem = (item: ListSortItem | undefined): ListSortItem | undefined => {
    if (item?.field != MY_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED) {
        return undefined;
    }
    const defaultSorting: ListSortItem = getDefaultListSortItem();
    const isDefaultValue = item.field == defaultSorting.field && item.order == defaultSorting.order;
    if (isDefaultValue) {
        return undefined;
    }
    return item;
};
