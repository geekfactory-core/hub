import type {IcrcAccount} from '@dfinity/ledger-icrc';
import {isNullish, principalToSubAccount} from '@dfinity/utils';
import {Canisters} from 'frontend/src/constants';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {getContractTemplateBlockedData, type ContractTemplateBlockedData} from 'frontend/src/context/contractTemplate/contractUtils';
import {useContractTemplate} from 'frontend/src/context/contractTemplate/useContractTemplate';
import {useActiveDeployment} from 'frontend/src/context/deployment/useActiveDeployment';
import {useConfigDataContext} from 'frontend/src/context/hub/config/ConfigDataProvider';
import {useICRCMetadata} from 'frontend/src/context/ledger/icrc/useICRCMetadata';
import {applicationLogger} from 'frontend/src/context/logger/logger';
import {MAINNET_LEDGER_CANISTER_ID} from 'frontend/src/utils/ic/constants';
import {getPrincipalIfValid} from 'frontend/src/utils/ic/principal';
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {DeploymentInformation} from 'src/declarations/hub/hub.did';
import {calculateDeploymentExpenses, type DeploymentExpensesResult, type Expenses} from './deploymentExpensesCalculator';

type RequiredData = {
    icrcSpender: IcrcAccount;
    contractTemplateName: string;
};

export type RequiredDataNotAvailableReason =
    | {type: 'connectedWalletIcrcAccountNotAvailable'}
    | {type: 'icrcSpenderNotAvailable'}
    | {type: 'icrcMetadataNotAvailable'}
    | {type: 'allowanceNotAvailable'}
    | {type: 'hubDataNotAvailable'}
    | {type: 'conversionRateNotAvailable'}
    | {type: 'contractTemplateInformationNotAvailable'}
    | {type: 'activeDeploymentDataNotAvailable'};

export type UnableToShowDeploymentModalFormReason = {type: 'deploymentNotAllowedOnTheBackend'} | {type: 'calculateDeploymentExpensesError'; error: Error};

export type UnableToStartDeploymentProcessReason = {type: 'activeDeploymentExists'; activeDeployment: DeploymentInformation} | {type: 'contractTemplateBlocked'; reason: string; timestamp: bigint};

type RequiredDataState =
    | {
          type: 'loading';
      }
    | {
          type: 'notAvailable';
          reason: RequiredDataNotAvailableReason;
      }
    | {
          type: 'unableToShowDeploymentModalFormReason';
          reason: UnableToShowDeploymentModalFormReason;
      }
    | {
          type: 'unableToStartDeploymentProcess';
          reason: UnableToStartDeploymentProcessReason;
          requiredData: RequiredData;
          expenses: Expenses;
      }
    | {
          type: 'readyToStartDeploymentProcess';
          requiredData: RequiredData;
          expenses: Expenses;
      };

type RequiredDataFunctions = {
    fetchHubConfigWithConversionRate: () => Promise<void>;
    fetchConfigWithConversionRateInProgress: boolean;

    refetchAllRequiredDataInProgress: boolean;
    refetchAllRequiredData: () => Promise<void>;
};

type Context = {
    requiredDataState: RequiredDataState;
} & RequiredDataFunctions;

export const useRequiredData = (contractTemplateId: bigint) => {
    const {principal} = useAuthContext();

    /**
    ==========================================
    ICRC Metadata
    ==========================================
    */

    const {fetchMetadata, metadataDataAvailability} = useICRCMetadata(MAINNET_LEDGER_CANISTER_ID);

    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    /**
    ==========================================
    ICRC Allowance
    ==========================================
    */

    const icrcSpender = useMemo<IcrcAccount | undefined>(() => {
        const owner = getPrincipalIfValid(Canisters.hub);
        if (isNullish(owner) || isNullish(principal)) {
            return undefined;
        }
        return {owner: owner, subaccount: principalToSubAccount(principal)};
    }, [principal]);

    /**
    ==========================================
    Config
    ==========================================
    */

    const {hubDataAvailability, conversionRateDataAvailability, isDeploymentAllowedOnTheBackend, fetchHubConfig, feature: fetchConfigFeature} = useConfigDataContext();

    const fetchHubConfigWithConversionRate = useCallback(() => {
        return fetchHubConfig({fetchConversionRate: true});
    }, [fetchHubConfig]);

    useEffect(() => {
        fetchHubConfigWithConversionRate();
    }, [fetchHubConfigWithConversionRate]);
    const fetchConfigWithConversionRateInProgress = fetchConfigFeature.status.inProgress;

    /**
    ==========================================
    Contract
    ==========================================
    */

    const contractTemplate = useContractTemplate(contractTemplateId);
    const {fetchContractTemplateInformation, dataAvailability: contractTemplateInformationAvailability} = contractTemplate;
    useEffect(() => {
        fetchContractTemplateInformation();
    }, [fetchContractTemplateInformation]);

    /**
    ==========================================
    Active Deployment
    ==========================================
    */

    const activeDeployment = useActiveDeployment();
    const {fetchActiveDeployment, activeDeploymentDataAvailability} = activeDeployment;

    useEffect(() => {
        fetchActiveDeployment();
    }, [fetchActiveDeployment]);

    /**
    ==========================================
    Refetch Required Data
    ==========================================
    */

    const [refetchAllRequiredDataInProgress, setRefetchAllCommonRequiredDataInProgress] = useState(false);
    const refetchAllRequiredData = useCallback(async () => {
        setRefetchAllCommonRequiredDataInProgress(true);
        await Promise.allSettled([fetchMetadata(), fetchHubConfigWithConversionRate(), fetchActiveDeployment()]);
        setRefetchAllCommonRequiredDataInProgress(false);
    }, [fetchMetadata, fetchHubConfigWithConversionRate, fetchActiveDeployment]);

    const requiredDataState = useMemo<RequiredDataState>(() => {
        applicationLogger.debug('useRequiredData: calculating requiredDataState', {
            metadataDataAvailability,
            hubDataAvailability,
            contractTemplateInformationAvailability,
            activeDeploymentDataAvailability,
            fetchConfigWithConversionRateInProgress,
            conversionRateDataAvailability
        });
        /**
        ==========================================
        Loading
        ==========================================
        */
        if (
            metadataDataAvailability.type == 'loading' ||
            hubDataAvailability.type == 'loading' ||
            contractTemplateInformationAvailability.type == 'loading' ||
            activeDeploymentDataAvailability.type == 'loading'
        ) {
            return {type: 'loading'};
        }
        /**
         * Hub data availability is loaded on the first successful fetch when the page loads. However, the Deploy Modal
         * refetches the hub config with the conversion rate, so we need to check the conversion rate loading state separately.
         * The conversion rate is required to deploy a contract but is loaded as part of the hub config loading process.
         */
        if (isNullish(conversionRateDataAvailability) && fetchConfigWithConversionRateInProgress) {
            return {type: 'loading'};
        }
        if (conversionRateDataAvailability?.type == 'loading') {
            /**
             * This check is needed only for type safety later in this function - conversionRateDataAvailability cannot be in a "loading" state.
             * Illegal state - we should never reach here.
             */
            return {type: 'loading'};
        }

        /**
        ==========================================
        Not Available
        ==========================================
        */
        const notAvailableResult = (reason: RequiredDataNotAvailableReason): RequiredDataState => {
            return {type: 'notAvailable', reason};
        };
        if (isNullish(icrcSpender)) {
            return notAvailableResult({type: 'icrcSpenderNotAvailable'});
        }
        if (metadataDataAvailability.type == 'notAvailable') {
            return notAvailableResult({type: 'icrcMetadataNotAvailable'});
        }
        if (hubDataAvailability.type == 'notAvailable') {
            return notAvailableResult({type: 'hubDataNotAvailable'});
        }
        if (isNullish(conversionRateDataAvailability) || conversionRateDataAvailability.type == 'notAvailable') {
            return notAvailableResult({type: 'conversionRateNotAvailable'});
        }
        if (contractTemplateInformationAvailability.type == 'notAvailable') {
            return notAvailableResult({type: 'contractTemplateInformationNotAvailable'});
        }
        if (activeDeploymentDataAvailability.type == 'notAvailable') {
            return notAvailableResult({type: 'activeDeploymentDataNotAvailable'});
        }

        if (!isDeploymentAllowedOnTheBackend) {
            return {
                type: 'unableToShowDeploymentModalFormReason',
                reason: {type: 'deploymentNotAllowedOnTheBackend'}
            } satisfies RequiredDataState;
        }

        /**
        ==========================================
        Data Available
        ==========================================
        */

        const {
            metadata: {fee: icrcLedgerFeeUlps}
        } = metadataDataAvailability;

        const {
            name: contractTemplateName,
            contract_canister_settings: {initial_cycles: contractTemplateInitialCycles}
        } = contractTemplateInformationAvailability.contractTemplateInformation.definition;
        const contractTemplateBlockedData: ContractTemplateBlockedData = getContractTemplateBlockedData(contractTemplateInformationAvailability.contractTemplateInformation);

        const {existence: activeDeploymentExistence} = activeDeploymentDataAvailability;

        const requiredData: RequiredData = {
            icrcSpender,
            contractTemplateName
        };

        const {
            deployment_cycles_cost: deploymentCostCycles,
            deployment_expenses_amount_buffer_permyriad: deploymentExpensesAmountBufferPermyriad,
            deployment_expenses_amount_decimal_places: deploymentExpensesAmountDecimalPlaces,
            deployment_allowance_expiration_timeout: deploymentAllowanceExpirationTimeoutMillis
        } = hubDataAvailability.hubConfig;
        const {xdrPermyriadPerIcp} = conversionRateDataAvailability;
        const deploymentExpensesResult: DeploymentExpensesResult = calculateDeploymentExpenses({
            contractTemplateInitialCycles,
            deploymentCostCycles,
            xdrPermyriadPerIcp,
            icrcLedgerFeeUlps,
            deploymentExpensesAmountBufferPermyriad,
            deploymentExpensesAmountDecimalPlaces,
            deploymentAllowanceExpirationTimeoutMillis,
            logger: applicationLogger
        });
        if (deploymentExpensesResult.type === 'error') {
            return {
                type: 'unableToShowDeploymentModalFormReason',
                reason: {type: 'calculateDeploymentExpensesError', error: deploymentExpensesResult.error}
            } satisfies RequiredDataState;
        }

        const {expenses} = deploymentExpensesResult;

        if (activeDeploymentExistence.type === 'exists') {
            return {
                type: 'unableToStartDeploymentProcess',
                reason: {
                    type: 'activeDeploymentExists',
                    activeDeployment: activeDeploymentExistence.activeDeployment
                },
                requiredData,
                expenses
            } satisfies RequiredDataState;
        }

        if (contractTemplateBlockedData.type === 'blocked') {
            return {
                type: 'unableToStartDeploymentProcess',
                reason: {
                    type: 'contractTemplateBlocked',
                    reason: contractTemplateBlockedData.reason,
                    timestamp: contractTemplateBlockedData.timestamp
                },
                requiredData,
                expenses
            } satisfies RequiredDataState;
        }

        return {type: 'readyToStartDeploymentProcess', requiredData, expenses} satisfies RequiredDataState;
    }, [
        metadataDataAvailability,
        hubDataAvailability,
        contractTemplateInformationAvailability,
        activeDeploymentDataAvailability,
        fetchConfigWithConversionRateInProgress,
        conversionRateDataAvailability,
        icrcSpender,
        isDeploymentAllowedOnTheBackend
    ]);

    return useMemo<Context>(() => {
        return {
            requiredDataState,

            fetchHubConfigWithConversionRate,
            fetchConfigWithConversionRateInProgress,

            refetchAllRequiredDataInProgress,
            refetchAllRequiredData
        };
    }, [requiredDataState, fetchHubConfigWithConversionRate, fetchConfigWithConversionRateInProgress, refetchAllRequiredDataInProgress, refetchAllRequiredData]);
};
