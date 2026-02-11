import {nonNullish} from '@dfinity/utils';
import {Select} from 'antd';
import {getDefaultListSortItem, useContractDeploymentsProviderContext} from 'frontend/src/context/contractTemplate/ContractDeploymentsProvider';
import type {ListSortItem} from 'frontend/src/hook/useRemoteListWithUrlState';
import {serializeListSortItem} from 'frontend/src/hook/useRemoteListWithUrlState';
import {i18} from 'frontend/src/i18';
import type {DefaultOptionType} from 'rc-select/lib/Select';
import {useMemo} from 'react';
import {CONTRACT_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED} from '../ContractDeploymentsEntryPoint';

type OptionType = DefaultOptionType;

export const SortingSelect = (props: {onChange: (value: string) => void; disabled: boolean}) => {
    const {
        listState,
        feature: {
            status: {inProgress}
        }
    } = useContractDeploymentsProviderContext();

    const options: Array<OptionType> = useMemo(() => {
        return [
            {
                label: i18.deployments.form.sorting.newest,
                value: serializeListSortItem(getDefaultListSortItem())
            },
            {
                label: i18.deployments.form.sorting.oldest,
                value: serializeListSortItem({
                    field: CONTRACT_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED,
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
    if (item?.field != CONTRACT_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED) {
        return undefined;
    }
    const defaultSorting: ListSortItem = getDefaultListSortItem();
    const isDefaultValue = item.field == defaultSorting.field && item.order == defaultSorting.order;
    if (isDefaultValue) {
        return undefined;
    }
    return item;
};
