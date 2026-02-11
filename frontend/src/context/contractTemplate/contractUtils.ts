import {fromNullable, nonNullish} from '@dfinity/utils';
import type {ContractTemplateInformation} from 'src/declarations/hub/hub.did';

export type ContractTemplateBlockedData = {type: 'active'} | {type: 'blocked'; reason: string; timestamp: bigint};
export const getContractTemplateBlockedData = (contractTemplateInformation: ContractTemplateInformation): ContractTemplateBlockedData => {
    const value = fromNullable(contractTemplateInformation.blocked);
    return nonNullish(value) ? {type: 'blocked', reason: value.value, timestamp: value.timestamp} : {type: 'active'};
};
