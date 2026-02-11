import {LoadingOutlined, ReloadOutlined} from '@ant-design/icons';
import {ICPToken, isEmptyString, isNullish} from '@dfinity/utils';
import {Flex} from 'antd';
import {IconOnlyButton} from 'frontend/src/components/widgets/button/IconOnlyButton';
import {KeyValueHorizontal} from 'frontend/src/components/widgets/KeyValueHorizontal';
import {KeyValueVertical} from 'frontend/src/components/widgets/KeyValueVertical';
import {QuestionPopover} from 'frontend/src/components/widgets/QuestionPopover';
import {i18} from 'frontend/src/i18';
import {formatAtomicAmountRounded} from 'frontend/src/utils/core/number/atomic/atomic';
import {formatTokenAmountWithSymbol} from 'frontend/src/utils/core/token/token';
import {formatIcpXdrConversionRateInTCyclesPerICP} from 'frontend/src/utils/ic/cycles/format';
import {useCallback, useMemo} from 'react';
import {useDeployContractModalDataContext} from './DeployContractModalDataProvider';
import {type Expenses} from './deploymentExpensesCalculator';

export const InfoPanel = () => {
    const {
        requiredData: {requiredDataState}
    } = useDeployContractModalDataContext();

    if (requiredDataState.type != 'unableToStartDeploymentProcess' && requiredDataState.type != 'readyToStartDeploymentProcess') {
        // Illegal state - we should never reach here.
        return null;
    }

    const {expenses} = requiredDataState;

    return (
        <Flex vertical gap={16}>
            <div>{i18.contractTemplate.deployModal.description}</div>
            <Flex vertical gap={16}>
                <KeyValueVertical label={i18.contractTemplate.deployModal.name} value={requiredDataState.requiredData.contractTemplateName} />
                <Flex vertical gap={8}>
                    <RequiredCycles expenses={expenses} />
                    <ConversionRateRow xdrPermyriadPerIcp={requiredDataState.expenses.xdrPermyriadPerIcp} />
                    <TransactionFeeRow expenses={expenses} />
                    <PriceRow expenses={expenses} />
                </Flex>
            </Flex>
        </Flex>
    );
};

const TransactionFeeRow = ({expenses}: {expenses: Expenses}) => {
    return <KeyValueHorizontal label={i18.contractTemplate.deployModal.transactionFee} value={formatTokenAmountWithSymbol(expenses.icrcLedgerFeeUlps, ICPToken)} valueClassName="gf-noWrap" />;
};

const PriceRow = ({expenses}: {expenses: Expenses}) => {
    return <KeyValueHorizontal label={i18.contractTemplate.deployModal.price} value={wrapUlpsFormattedValueWithStrong(expenses.totalCostUlps)} valueClassName="gf-noWrap" />;
};

const ConversionRateRow = ({xdrPermyriadPerIcp}: {xdrPermyriadPerIcp: bigint}) => {
    const {
        requiredData: {fetchHubConfigWithConversionRate, fetchConfigWithConversionRateInProgress}
    } = useDeployContractModalDataContext();

    const icon = fetchConfigWithConversionRateInProgress ? <LoadingOutlined /> : <ReloadOutlined />;

    const onClick = useCallback(() => {
        fetchHubConfigWithConversionRate();
    }, [fetchHubConfigWithConversionRate]);

    const valueLabel = useMemo(() => formatIcpXdrConversionRateInTCyclesPerICP(xdrPermyriadPerIcp), [xdrPermyriadPerIcp]);

    if (isNullish(valueLabel)) {
        // Illegal state - we should never reach here.
        return null;
    }

    return (
        <KeyValueHorizontal
            label={i18.contractTemplate.deployModal.conversionRate}
            value={
                <Flex gap={4} align="center">
                    <IconOnlyButton icon={icon} type="link" size="small" className="gf-no-padding" onClick={onClick} disabled={fetchConfigWithConversionRateInProgress} />
                    <span>{valueLabel}</span>
                </Flex>
            }
            valueClassName="gf-noWrap"
        />
    );
};

const RequiredCycles = ({expenses}: {expenses: Expenses}) => {
    const value = useMemo(() => `${formatAtomicAmountRounded(expenses.totalRequiredCycles, 12, {maxDecimalPlaces: 4})}T Cycles`, [expenses.totalRequiredCycles]);

    const label = useMemo(() => {
        if (isNullish(expenses)) {
            return null;
        }
        const totalFee = expenses.deploymentCostCycles + expenses.deploymentCostBufferCycles;
        const popoverContent = (
            <Flex vertical gap={8} style={{minWidth: 300}}>
                <KeyValueHorizontal
                    gap={16}
                    label={i18.contractTemplate.deployModal.contractInitialAllocation}
                    value={`${formatAtomicAmountRounded(expenses.contractTemplateInitialCycles, 12)}T Cycles`}
                />
                <KeyValueHorizontal gap={16} label={i18.contractTemplate.deployModal.deploymentCost} value={`${formatAtomicAmountRounded(totalFee, 12)}T Cycles`} />
            </Flex>
        );
        return (
            <Flex gap={8}>
                <span>{i18.contractTemplate.deployModal.requiredCycles}</span>
                <QuestionPopover content={popoverContent} />
            </Flex>
        );
    }, [expenses]);

    if (isNullish(label) || isNullish(value)) {
        return null;
    }
    return <KeyValueHorizontal label={label} value={value} />;
};

const wrapUlpsFormattedValueWithStrong = (ulps: bigint | undefined) => {
    const value = formatTokenAmountWithSymbol(ulps, ICPToken, {fallback: ''});
    if (isEmptyString(value)) {
        return '-';
    }
    return <span className="gf-strong">{value}</span>;
};
