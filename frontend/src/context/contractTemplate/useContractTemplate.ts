import {nonNullish} from '@dfinity/utils';
import {useICCanisterCallHubAnonymous} from 'frontend/src/api/hub/useICCallHub';
import type {DataAvailability, Feature} from 'frontend/src/utils/core/feature/feature';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {useMemo} from 'react';
import type {ContractTemplateInformation, GetContractTemplateError} from 'src/declarations/hub/hub.did';
import {apiLogger} from '../logger/logger';
import {getContractTemplateBlockedData, getContractTemplateRetiredData, type ContractTemplateBlockedData, type ContractTemplateRetiredData} from './contractUtils';

type ContractTemplateInformationAvailability =
    | DataAvailability<{contractTemplateInformation: ContractTemplateInformation}>
    | {type: 'blocked'; reason: string; contractTemplateInformation: ContractTemplateInformation};

type Context = {
    contractTemplateInformation: ContractTemplateInformation | undefined;
    contractTemplateInformationError: GetContractTemplateError | undefined;
    feature: Feature;
    fetchContractTemplateInformation: () => Promise<void>;

    dataAvailability: ContractTemplateInformationAvailability;
    retiredData: ContractTemplateRetiredData | undefined;
};
export const useContractTemplate = (contractTemplateId: bigint): Context => {
    const {call, data, responseError: contractTemplateInformationError, feature} = useICCanisterCallHubAnonymous('getContractTemplate');

    const fetchContractTemplateInformation = useMemo(
        () =>
            reusePromiseWrapper(async () => {
                const logMessagePrefix = `useContractTemplate[${contractTemplateId.toString()}]:`;
                await call([{contractTemplateId, certified: true}], {
                    logger: apiLogger,
                    logMessagePrefix
                });
            }),
        [call, contractTemplateId]
    );

    const contractTemplateInformation = data?.contract_template;

    const retiredData: ContractTemplateRetiredData | undefined = useMemo(
        () => (nonNullish(contractTemplateInformation) ? getContractTemplateRetiredData(contractTemplateInformation) : undefined),
        [contractTemplateInformation]
    );

    const dataAvailability: ContractTemplateInformationAvailability = useMemo(() => {
        if (feature.status.loaded) {
            if (nonNullish(contractTemplateInformation)) {
                const contractBlockedData: ContractTemplateBlockedData = getContractTemplateBlockedData(contractTemplateInformation);
                if (contractBlockedData.type == 'blocked') {
                    return {type: 'blocked', reason: contractBlockedData.reason, contractTemplateInformation};
                }
                return {type: 'available', contractTemplateInformation};
            } else {
                return {type: 'notAvailable'};
            }
        } else {
            return {type: 'loading'};
        }
    }, [feature.status.loaded, contractTemplateInformation]);

    return useMemo(
        () => ({
            contractTemplateInformation,
            contractTemplateInformationError,
            feature,
            fetchContractTemplateInformation,
            dataAvailability,
            retiredData
        }),
        [contractTemplateInformation, contractTemplateInformationError, feature, fetchContractTemplateInformation, dataAvailability, retiredData]
    );
};
