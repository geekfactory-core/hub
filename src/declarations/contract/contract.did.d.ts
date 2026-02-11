import type {ActorMethod} from '@dfinity/agent';
import type {IDL} from '@dfinity/candid';
import type {Principal} from '@dfinity/principal';

export type GetContractOwnerError = {ContractNotActivated: null} | {ContractActivationNotRequired: null};
export type GetContractOwnerResponse = {Ok: GetContractOwnerResult} | {Err: GetContractOwnerError};
export interface GetContractOwnerResult {
    owner: Principal;
}
export interface _SERVICE {
    get_contract_owner: ActorMethod<[{}], GetContractOwnerResponse>;
}
declare const idlFactory: IDL.InterfaceFactory;
