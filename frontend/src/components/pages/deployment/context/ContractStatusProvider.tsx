import type {Principal} from '@dfinity/principal';
import {fromNullable, isNullish, nonNullish} from '@dfinity/utils';
import {useContractTemplateContextSafe} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import {useContractActivationState, type ContractActivationDataAvailability} from 'frontend/src/context/contractTemplate/useContractActivationState';
import {useDeploymentContextSafe} from 'frontend/src/context/deployment/DeploymentProvider';
import {getContractDeploymentState, type ContractDeploymentState} from 'frontend/src/context/deployment/deploymentInformationUtils';
import {useValidateContractCertificate, type ContractValidationDataAvailability} from 'frontend/src/context/validateContract/useValidateContractCertificate';
import type {Feature} from 'frontend/src/utils/core/feature/feature';
import {createContext, useCallback, useContext, useEffect, useMemo, type PropsWithChildren} from 'react';

type ContractActivationDataAvailabilityExt = ContractActivationDataAvailability | {type: 'notApplicable'} | {type: 'notRequired'};
type ContractValidationDataAvailabilityExt = ContractValidationDataAvailability | {type: 'notApplicable'};

type Context = {
    contractDeploymentState: ContractDeploymentState | undefined;
    contractActivationDataAvailability: ContractActivationDataAvailabilityExt;
    contractActivationStateFeature: Feature;
    contractValidationDataAvailability: ContractValidationDataAvailabilityExt;
    contractValidationStateFeature: Feature;
    isItSafeToUseContract: boolean;
    fetchContractActivationState: () => Promise<void>;
    fetchNotAvailableData: () => Promise<void>;
};

const Context = createContext<Context | undefined>(undefined);

export const useContractStatusContext = () => {
    const context = useContext<Context | undefined>(Context);
    if (!context) {
        throw new Error('useContractStatusContext must be used within a ContractStatusProvider');
    }
    return context;
};

export const ContractStatusProvider = (props: PropsWithChildren) => {
    const {
        contractTemplateInformation: {
            definition: {activation_required}
        }
    } = useContractTemplateContextSafe();
    const {deployment} = useDeploymentContextSafe();
    const contractCanister = useMemo<Principal | undefined>(() => fromNullable(deployment.contract_canister), [deployment.contract_canister]);
    const contractCanisterId = useMemo<string | undefined>(() => contractCanister?.toText(), [contractCanister]);

    /**
    ==========================================
    Contract Deployment State
    ==========================================
    */
    const contractDeploymentState = useMemo<ContractDeploymentState | undefined>(
        () => getContractDeploymentState(deployment.state, deployment.contract_canister),
        [deployment.contract_canister, deployment.state]
    );

    /**
    ==========================================
    Contract Activation State
    ==========================================
    */

    /**
     * Determines if the contract activation state should be fetched.
     * This is the case when the contract activation is required and the contract successfully deployed.
     */
    const shouldFetchContractActivationState = activation_required && contractDeploymentState?.type == 'success';

    const {
        contractActivationDataAvailability: contractActivationDataAvailabilityRaw,
        feature: contractActivationStateFeature,
        fetchContractActivationState
    } = useContractActivationState(contractCanisterId);

    const contractActivationDataAvailability = useMemo<ContractActivationDataAvailabilityExt>(() => {
        if (!activation_required) {
            return {type: 'notRequired'};
        }
        if (!shouldFetchContractActivationState) {
            /**
             * Contract activation is not applicable in this case.
             */
            return {type: 'notApplicable'};
        }
        if (isNullish(contractActivationDataAvailabilityRaw)) {
            /**
             * Simulated loading state because the contract activation state will be fetched in useEffect.
             */
            return {type: 'loading'};
        }
        return contractActivationDataAvailabilityRaw;
    }, [activation_required, contractActivationDataAvailabilityRaw, shouldFetchContractActivationState]);

    useEffect(() => {
        if (shouldFetchContractActivationState) {
            fetchContractActivationState();
        }
    }, [shouldFetchContractActivationState, fetchContractActivationState]);

    /**
    ==========================================
    Contract Validation State
    ==========================================
    */
    const contractCanisterToValidate = useMemo<Principal | undefined>(() => {
        if (contractDeploymentState?.type == 'success' && nonNullish(contractCanister)) {
            /**
             * Contract validation is applicable only when the contract is successfully deployed and the canister is available.
             */
            return contractCanister;
        }
    }, [contractDeploymentState?.type, contractCanister]);

    const {contractValidationDataAvailability: contractValidationDataAvailabilityRaw, feature: contractValidationStateFeature, validate} = useValidateContractCertificate();

    const contractValidationDataAvailability = useMemo<ContractValidationDataAvailabilityExt>(() => {
        if (isNullish(contractCanisterToValidate)) {
            return {type: 'notApplicable'};
        }
        if (isNullish(contractValidationDataAvailabilityRaw)) {
            /**
             * Simulated loading state because the contract validation state will be fetched in useEffect.
             */
            return {type: 'loading'};
        }
        return contractValidationDataAvailabilityRaw;
    }, [contractCanisterToValidate, contractValidationDataAvailabilityRaw]);

    const validateContract = useCallback(() => {
        if (nonNullish(contractCanisterToValidate)) {
            validate({
                contract_reference: {
                    Canister: contractCanisterToValidate
                }
            });
        }
    }, [contractCanisterToValidate, validate]);

    useEffect(() => {
        validateContract();
    }, [validateContract]);

    const isItSafeToUseContract = useMemo(() => {
        if (isNullish(contractDeploymentState)) {
            // Illegal state - we should never reach here.
            return false;
        }
        const contractDeployed = contractDeploymentState.type == 'success';
        const contractActivationNotRequired = contractActivationDataAvailability.type == 'notRequired';
        const contractActivated = contractActivationDataAvailability.type == 'available' && contractActivationDataAvailability.activationState.type == 'activated';
        const certificateValidAndActive = contractValidationDataAvailability.type == 'available' && contractValidationDataAvailability.validationState.type == 'certificateValidAndActive';

        if (contractDeployed && (contractActivationNotRequired || contractActivated) && certificateValidAndActive) {
            return true;
        }

        return false;
    }, [contractDeploymentState, contractActivationDataAvailability, contractValidationDataAvailability]);

    /**
    ==========================================
    Fetch Not Available Data
    ==========================================
    */

    const fetchNotAvailableData = useCallback(async () => {
        if (contractActivationDataAvailability.type == 'notAvailable') {
            fetchContractActivationState();
        }
        if (
            contractValidationDataAvailability.type == 'notAvailable' ||
            (contractValidationDataAvailability.type == 'available' && contractValidationDataAvailability.validationState.type == 'backendErrorWithRetry')
        ) {
            validateContract();
        }
    }, [contractActivationDataAvailability.type, contractValidationDataAvailability, fetchContractActivationState, validateContract]);

    const value = useMemo(
        () => ({
            contractDeploymentState,
            contractActivationDataAvailability,
            contractActivationStateFeature,
            contractValidationDataAvailability,
            contractValidationStateFeature,
            isItSafeToUseContract,
            fetchContractActivationState,
            fetchNotAvailableData
        }),
        [
            contractDeploymentState,
            contractActivationDataAvailability,
            contractActivationStateFeature,
            contractValidationDataAvailability,
            contractValidationStateFeature,
            isItSafeToUseContract,
            fetchContractActivationState,
            fetchNotAvailableData
        ]
    );

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};
