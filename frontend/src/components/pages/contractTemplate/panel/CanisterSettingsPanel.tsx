import {fromNullable, nonNullish, type Nullable} from '@dfinity/utils';
import {Flex} from 'antd';
import {KeyValueVertical} from 'frontend/src/components/widgets/KeyValueVertical';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {useContractTemplateContextSafe} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import {i18} from 'frontend/src/i18';
import {formatDuration} from 'frontend/src/utils/core/date/format';
import {formatMemoryBytes} from 'frontend/src/utils/core/memory/format';
import {formatNumberWithUnit, formatValueWithUnit} from 'frontend/src/utils/core/number/format';
import {convertFractionalAdaptiveSI} from 'frontend/src/utils/core/number/si/convert';
import {formatCycles} from 'frontend/src/utils/ic/cycles/format';
import {useMemo} from 'react';

export const CanisterSettingsPanel = () => {
    const {
        contractTemplateInformation: {
            definition: {contract_canister_settings}
        }
    } = useContractTemplateContextSafe();

    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <PanelHeader title={i18.status.contractCanisterSettings.panelTitle} />
                <Flex vertical gap={8}>
                    <KeyValueVertical label={i18.status.abstractCanisterSettings.initialCycles} value={<InitialCycles value={contract_canister_settings.initial_cycles} />} />
                    <KeyValueVertical label={i18.status.abstractCanisterSettings.freezingThreshold.label} value={<FreezingThreshold value={contract_canister_settings.freezing_threshold} />} />
                    <KeyValueVertical label={i18.status.abstractCanisterSettings.reservedCyclesLimit} value={<ReservedCyclesLimit value={contract_canister_settings.reserved_cycles_limit} />} />
                    <KeyValueVertical label={i18.status.abstractCanisterSettings.wasmMemoryLimit} value={<WasmMemoryLimit value={contract_canister_settings.wasm_memory_limit} />} />
                    <KeyValueVertical label={i18.status.abstractCanisterSettings.wasmMemoryThreshold} value={<WasmMemoryThreshold value={contract_canister_settings.wasm_memory_threshold} />} />
                    <KeyValueVertical label={i18.status.abstractCanisterSettings.memoryAllocation} value={<MemoryAllocation value={contract_canister_settings.memory_allocation} />} />
                    <KeyValueVertical label={i18.status.abstractCanisterSettings.computeAllocation} value={<ComputeAllocation value={contract_canister_settings.compute_allocation} />} />
                </Flex>
            </Flex>
        </PanelCard>
    );
};

const InitialCycles = ({value}: {value: bigint}) => {
    return useMemo(() => formatCycles(value, {fallback: i18.status.abstractCanisterSettings.defaultValue}), [value]);
};

const FreezingThreshold = ({value}: {value: Nullable<bigint>}) => {
    return useMemo(() => {
        const freezingThreshold = fromNullable(value);
        const freezingThresholdValue = formatNumberWithUnit(freezingThreshold, i18.status.abstractCanisterSettings.freezingThreshold.valuePostfix, {
            fallback: i18.status.abstractCanisterSettings.defaultValue
        });
        const freezingThresholdDurationFormatted = nonNullish(freezingThreshold) ? formatDuration(Number(freezingThreshold) * 1000) : undefined;
        const freezingThresholdValuePostfix = nonNullish(freezingThresholdDurationFormatted) ? <span className="gf-font-size-smaller"> ({freezingThresholdDurationFormatted})</span> : null;
        return (
            <>
                {freezingThresholdValue}
                {freezingThresholdValuePostfix}
            </>
        );
    }, [value]);
};

const ReservedCyclesLimit = ({value}: {value: Nullable<bigint>}) => {
    return useMemo(() => formatCycles(fromNullable(value), {fallback: i18.status.abstractCanisterSettings.defaultValue}), [value]);
};

const WasmMemoryLimit = ({value}: {value: Nullable<bigint>}) => {
    return useMemo(() => formatMemoryBytes(fromNullable(value), {fallback: i18.status.abstractCanisterSettings.defaultValue}), [value]);
};

const WasmMemoryThreshold = ({value}: {value: Nullable<bigint>}) => {
    return useMemo(() => formatMemoryBytes(fromNullable(value), {fallback: i18.status.abstractCanisterSettings.defaultValue}), [value]);
};

const MemoryAllocation = ({value}: {value: Nullable<bigint>}) => {
    return useMemo(() => formatMemoryBytes(fromNullable(value), {fallback: i18.status.abstractCanisterSettings.defaultValue}), [value]);
};

const ComputeAllocation = ({value}: {value: Nullable<bigint>}) => {
    return useMemo(() => {
        const computeAllocation = convertFractionalAdaptiveSI(fromNullable(value));
        return formatValueWithUnit(computeAllocation, {
            fallback: i18.status.abstractCanisterSettings.defaultValue
        });
    }, [value]);
};
