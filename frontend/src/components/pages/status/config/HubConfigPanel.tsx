import {isNullish, nonNullish, notEmptyString} from '@dfinity/utils';
import {Flex} from 'antd';
import {LoadingAndFailedToLoadValueWrapper} from 'frontend/src/components/widgets/alert/LoadingAndFailedToLoadValueWrapper';
import {ReloadIconButton} from 'frontend/src/components/widgets/button/ReloadIconButton';
import {KeyValueVertical} from 'frontend/src/components/widgets/KeyValueVertical';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {CopyableUIDComponent} from 'frontend/src/components/widgets/uid/CopyableUIDComponent';
import {useConfigDataContext} from 'frontend/src/context/hub/config/ConfigDataProvider';
import {i18} from 'frontend/src/i18';
import {formatDuration} from 'frontend/src/utils/core/date/format';
import {convertBytesFractionalAdaptive} from 'frontend/src/utils/core/memory/convert';
import {formatMemoryBytesValueWithUnit} from 'frontend/src/utils/core/memory/format';
import {formatNumber, formatNumberWithUnit} from 'frontend/src/utils/core/number/format';
import {convertFractionalAdaptiveSI} from 'frontend/src/utils/core/number/si/convert';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {formatCyclesValueWithUnit, formatIcpXdrConversionRateInTCyclesPerICP} from 'frontend/src/utils/ic/cycles/format';
import {useMemo, type ReactNode} from 'react';
import type {CreateContractCanisterStrategy, CyclesConvertingStrategy, IcpXdrConversionRateStrategy} from 'src/declarations/hub/hub.did';
import {PERMYRIAD_DENOMINATOR} from '../../contractTemplate/deployContractModal/deploymentExpensesCalculator';

export const HubConfigPanel = () => {
    const {hubDataAvailability} = useConfigDataContext();
    const hubConfig = hubDataAvailability.type == 'available' ? hubDataAvailability.hubConfig : undefined;
    const deploymentCostBufferPercentage = `${formatNumber((Number(hubConfig?.deployment_expenses_amount_buffer_permyriad ?? 0n) / Number(PERMYRIAD_DENOMINATOR)) * 100, 2)}%`;
    const deploymentCostRounding = nonNullish(hubConfig) ? `${hubConfig.deployment_expenses_amount_decimal_places}${i18.status.hubConfiguration.deploymentCostRoundingDigits}` : undefined;
    return (
        <Flex vertical gap={16}>
            <PanelCard>
                <Flex vertical gap={16}>
                    <Flex justify="space-between">
                        <PanelHeader title={i18.status.hubConfiguration.panelTitle} />
                        <RefreshButton />
                    </Flex>
                    <Flex vertical gap={24}>
                        <Flex vertical gap={8}>
                            <KeyValueComponent
                                label={i18.status.hubConfiguration.deploymentAvailable}
                                value={hubConfig?.is_deployment_available ? i18.status.hubConfiguration.deploymentAvailableYes : i18.status.hubConfiguration.deploymentAvailableNo}
                            />
                            <KeyValueComponent
                                label={i18.status.hubConfiguration.deploymentCyclesCost}
                                value={formatCyclesValueWithUnit(convertFractionalAdaptiveSI(hubConfig?.deployment_cycles_cost, 'T'))}
                            />
                            <KeyValueComponent label={i18.status.hubConfiguration.deploymentCostBuffer} value={deploymentCostBufferPercentage} />
                            <KeyValueComponent label={i18.status.hubConfiguration.deploymentCostRounding} value={deploymentCostRounding} />
                            <KeyValueComponent
                                label={i18.status.contractsSettings.allowanceExpiration}
                                value={<AllowanceExpirationComponent value={hubConfig?.deployment_allowance_expiration_timeout} />}
                            />
                        </Flex>
                        <Flex vertical gap={8}>
                            <KeyValueComponent
                                label={i18.status.hubConfiguration.cyclesConvertingStrategy}
                                value={<CyclesConvertingStrategyComponent value={hubConfig?.cycles_converting_strategy} />}
                            />
                            <KeyValueComponent
                                label={i18.status.hubConfiguration.icpXdrConversionRateStrategy}
                                value={<IcpXdrConversionRateStrategyComponent value={hubConfig?.icp_xdr_conversion_rate_strategy} />}
                            />
                            <KeyValueComponent
                                label={i18.status.hubConfiguration.createContractCanisterStrategy}
                                value={<CreateContractCanisterStrategyComponent value={hubConfig?.contract_canister_creation_strategy} />}
                            />
                            <KeyValueComponent
                                label={i18.status.hubConfiguration.deploymentFallbackAccount}
                                value={notEmptyString(hubConfig?.deployment_fallback_account_hex) ? <CopyableUIDComponent uid={hubConfig.deployment_fallback_account_hex} /> : null}
                            />
                        </Flex>
                        <Flex vertical gap={8}>
                            <KeyValueComponent
                                label={i18.status.contractsSettings.maxContractWASMFileSize}
                                value={`${formatMemoryBytesValueWithUnit(convertBytesFractionalAdaptive(hubConfig?.contract_wasm_max_size))} (${formatNumberWithUnit(hubConfig?.contract_wasm_max_size, ' B')})`}
                            />
                            <KeyValueComponent
                                label={i18.status.contractsSettings.uploadWASMChunkSize}
                                value={`${formatMemoryBytesValueWithUnit(convertBytesFractionalAdaptive(hubConfig?.contract_wasm_upload_chunk_size))} (${formatNumberWithUnit(hubConfig?.contract_wasm_upload_chunk_size, ' B')})`}
                            />
                        </Flex>
                        <Flex vertical gap={8}>
                            <KeyValueComponent label={i18.status.hubConfiguration.contractTemplateNameMaxLength} value={formatNumberWithUnit(hubConfig?.name_max_length)} />
                            <KeyValueComponent label={i18.status.hubConfiguration.contractTemplateShortDescriptionMaxLength} value={formatNumberWithUnit(hubConfig?.short_description_max_length)} />
                            <KeyValueComponent label={i18.status.hubConfiguration.contractTemplateLongDescriptionMaxLength} value={formatNumberWithUnit(hubConfig?.long_description_max_length)} />
                        </Flex>
                        <Flex vertical gap={8}>
                            <KeyValueComponent
                                label={i18.status.contractsSettings.urlValidationRegex}
                                value={<RegexForParsingContractPrincipalFromUrlComponent value={hubConfig?.regex_for_contract_principal_parsing} />}
                            />
                            <KeyValueComponent label={i18.status.contractsSettings.canisterURLPattern} value={hubConfig?.contract_url_pattern ?? '-'} />
                        </Flex>
                        <Flex vertical gap={8}>
                            <KeyValueComponent label={i18.status.hubConfiguration.hubEventChunkSize} value={formatNumber(hubConfig?.max_hub_events_per_chunk)} />
                            <KeyValueComponent label={i18.status.hubConfiguration.templateChunkSize} value={formatNumber(hubConfig?.max_contract_templates_per_chunk)} />
                            <KeyValueComponent label={i18.status.hubConfiguration.deploymentChunkSize} value={formatNumber(hubConfig?.max_deployments_per_chunk)} />
                            <KeyValueComponent label={i18.status.hubConfiguration.deploymentEventChunkSize} value={formatNumber(hubConfig?.max_deployment_events_per_chunk)} />
                        </Flex>
                    </Flex>
                </Flex>
            </PanelCard>
        </Flex>
    );
};

const AllowanceExpirationComponent = (props: {value: bigint | undefined}) => {
    const {value} = props;

    return useMemo<ReactNode>(() => {
        if (isNullish(value)) {
            return '-';
        }
        return formatDuration(Number(value));
    }, [value]);
};

const KeyValueComponent = ({label, value}: {label: string; value: ReactNode}) => {
    const {hubDataAvailability, feature, fetchHubConfig} = useConfigDataContext();
    const {loaded, inProgress} = feature.status;
    const isError = hubDataAvailability.type == 'notAvailable';
    return (
        <KeyValueVertical
            label={label}
            value={
                <LoadingAndFailedToLoadValueWrapper loaded={loaded} isError={isError} inProgress={inProgress} action={fetchHubConfig}>
                    {value}
                </LoadingAndFailedToLoadValueWrapper>
            }
        />
    );
};

const RegexForParsingContractPrincipalFromUrlComponent = (props: {value: Array<string> | undefined}) => {
    const {value} = props;
    if (isNullish(value)) {
        return null;
    }
    return (
        <Flex vertical>
            {value.map((item, index) => (
                <div key={index}>{item}</div>
            ))}
        </Flex>
    );
};

const CyclesConvertingStrategyComponent = (props: {value: CyclesConvertingStrategy | undefined}) => {
    const {value} = props;
    if (isNullish(value)) {
        return null;
    }
    if (hasProperty(value, 'Skip')) {
        return i18.status.hubConfiguration.cyclesConvertingStrategySkipCMC;
    }
    return `${i18.status.hubConfiguration.cyclesConvertingStrategyUseCMC}${value.CMCTopUp.cmc_canister.toString()}`;
};

const CreateContractCanisterStrategyComponent = (props: {value: CreateContractCanisterStrategy | undefined}) => {
    const {value} = props;
    if (isNullish(value)) {
        return null;
    }
    if (hasProperty(value, 'OverManagementCanister')) {
        return i18.status.hubConfiguration.createContractCanisterStrategyOverManagementCanister;
    }
    return `${i18.status.hubConfiguration.createContractCanisterStrategyUseCMC}${value.OverCMC.cmc_canister.toString()}`;
};

const IcpXdrConversionRateStrategyComponent = (props: {value: IcpXdrConversionRateStrategy | undefined}) => {
    const {value} = props;
    if (isNullish(value)) {
        return null;
    }
    if (hasProperty(value, 'CMC')) {
        return `${i18.status.hubConfiguration.icpXdrConversionRateStrategyUseCMC}${value.CMC.cmc_canister.toString()}`;
    }
    return `${i18.status.hubConfiguration.icpXdrConversionRateStrategyFixed} ${formatIcpXdrConversionRateInTCyclesPerICP(value.Fixed.xdr_permyriad_per_icp)}`;
};

const RefreshButton = () => {
    const {feature, fetchHubConfig} = useConfigDataContext();
    const {inProgress, loaded} = feature.status;
    const disabled = inProgress || !loaded;
    return <ReloadIconButton onClick={() => fetchHubConfig()} loading={disabled} disabled={inProgress} />;
};
