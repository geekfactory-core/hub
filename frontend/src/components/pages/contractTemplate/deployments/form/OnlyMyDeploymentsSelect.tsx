import {Select} from 'antd';
import {
    getOnlyMyDeploymentsStateValueSafe,
    ONLY_MY_DEPLOYMENTS_DEFAULT_VALUE,
    type OnlyMyDeploymentsSelectValueType,
    useContractDeploymentsProviderContext
} from 'frontend/src/context/contractTemplate/ContractDeploymentsProvider';
import {i18} from 'frontend/src/i18';
import type {DefaultOptionType} from 'rc-select/lib/Select';
import {useMemo} from 'react';

interface OptionType extends DefaultOptionType {
    value: OnlyMyDeploymentsSelectValueType;
}

export const OnlyMyDeploymentsSelect = (props: {onChange: (value: OnlyMyDeploymentsSelectValueType) => void; disabled: boolean}) => {
    const {
        listState,
        feature: {
            status: {inProgress}
        }
    } = useContractDeploymentsProviderContext();

    const options: Array<OptionType> = useMemo(() => {
        return [
            {
                label: i18.deployments.form.onlyMyDeployments.allContracts,
                value: 'false'
            },
            {
                label: i18.deployments.form.onlyMyDeployments.onlyMyContracts,
                value: 'true'
            }
        ];
    }, []);

    const disabled = props.disabled || inProgress;

    const value: OnlyMyDeploymentsSelectValueType = useMemo(() => {
        const onlyMyDeploymentsValidatedValue = getOnlyMyDeploymentsStateValueSafe(listState.onlyMyDeployments);
        return onlyMyDeploymentsValidatedValue ?? ONLY_MY_DEPLOYMENTS_DEFAULT_VALUE;
    }, [listState.onlyMyDeployments]);

    return <Select<OnlyMyDeploymentsSelectValueType> value={value} options={options} popupMatchSelectWidth={false} onChange={props.onChange} disabled={disabled} />;
};
