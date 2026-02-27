import {Select} from 'antd';
import {
    CONTRACT_TEMPLATE_STATE_DEFAULT_VALUE,
    type ContractTemplateStateType,
    getContractTemplatesStateValueSafe,
    useContractTemplatesProviderContext
} from 'frontend/src/context/contractTemplates/ContractTemplatesProvider';
import {i18} from 'frontend/src/i18';
import type {DefaultOptionType} from 'rc-select/lib/Select';
import {useMemo} from 'react';

interface OptionType extends DefaultOptionType {
    value: ContractTemplateStateType;
}

export const TemplateStateSelect = (props: {onChange: (value: ContractTemplateStateType) => void; disabled: boolean}) => {
    const {
        listState,
        feature: {
            status: {inProgress}
        }
    } = useContractTemplatesProviderContext();

    const options: Array<OptionType> = useMemo(() => {
        return [
            {
                label: i18.contractTemplates.form.filter.all,
                value: 'all'
            },
            {
                label: i18.contractTemplates.form.filter.available,
                value: 'available'
            }
        ];
    }, []);

    const disabled = props.disabled || inProgress;

    const value: ContractTemplateStateType = useMemo(() => {
        const stateValue = getContractTemplatesStateValueSafe(listState.state);
        return stateValue ?? CONTRACT_TEMPLATE_STATE_DEFAULT_VALUE;
    }, [listState.state]);

    return <Select<ContractTemplateStateType> value={value} options={options} popupMatchSelectWidth={false} onChange={props.onChange} disabled={disabled} />;
};
