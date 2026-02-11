import {nonNullish} from '@dfinity/utils';
import {Select} from 'antd';
import {useContractTemplatesProviderContext} from 'frontend/src/context/contractTemplates/ContractTemplatesProvider';
import {getDefaultListSortItem} from 'frontend/src/context/myDeployments/MyDeploymentsProvider';
import {i18} from 'frontend/src/i18';
import type {DefaultOptionType} from 'rc-select/lib/Select';
import {useMemo} from 'react';
import type {ListSortItem} from '../../../hook/useRemoteListWithUrlState';
import {serializeListSortItem} from '../../../hook/useRemoteListWithUrlState';
import {CONTRACT_TEMPLATES_TABLE__COLUMN_KEY__DEPLOYMENTS, CONTRACT_TEMPLATES_TABLE__COLUMN_KEY__REGISTERED} from './ContractTemplatesEntryPoint';

type OptionType = DefaultOptionType;

export const SortingSelect = (props: {onChange: (value: string) => void; disabled: boolean}) => {
    const {
        listState,
        feature: {
            status: {inProgress}
        }
    } = useContractTemplatesProviderContext();

    const options: Array<OptionType> = useMemo(() => {
        return [
            {
                label: i18.contractTemplates.form.sorting.newest,
                value: serializeListSortItem(getDefaultListSortItem())
            },
            {
                label: i18.contractTemplates.form.sorting.oldest,
                value: serializeListSortItem({
                    field: CONTRACT_TEMPLATES_TABLE__COLUMN_KEY__REGISTERED,
                    order: 'ascend'
                })
            },
            {
                label: i18.contractTemplates.form.sorting.mostDeployed,
                value: serializeListSortItem({
                    field: CONTRACT_TEMPLATES_TABLE__COLUMN_KEY__DEPLOYMENTS,
                    order: 'descend'
                })
            },
            {
                label: i18.contractTemplates.form.sorting.leastDeployed,
                value: serializeListSortItem({
                    field: CONTRACT_TEMPLATES_TABLE__COLUMN_KEY__DEPLOYMENTS,
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

const validateListSortItem = (item: ListSortItem | undefined): ListSortItem | undefined => {
    if (item?.field != CONTRACT_TEMPLATES_TABLE__COLUMN_KEY__REGISTERED && item?.field != CONTRACT_TEMPLATES_TABLE__COLUMN_KEY__DEPLOYMENTS) {
        return undefined;
    }
    const defaultSorting: ListSortItem = getDefaultListSortItem();
    const isDefaultValue = item.field == defaultSorting.field && item.order === defaultSorting.order;
    if (isDefaultValue) {
        return undefined;
    }
    return item;
};
