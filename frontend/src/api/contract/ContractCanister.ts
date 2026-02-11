import type {Principal} from '@dfinity/principal';
import type {CanisterOptions} from '@dfinity/utils';
import {Canister, createServices} from '@dfinity/utils';
import {type _SERVICE, idlFactory} from 'src/declarations/contract/contract.did.js';

type ContractService = _SERVICE;

interface ContractCanisterOptions<T> extends Omit<CanisterOptions<T>, 'canisterId'> {
    canisterId: Principal;
}

export class ContractAnonymousCanister extends Canister<ContractService> {
    static create(options: ContractCanisterOptions<ContractService>) {
        const {service, certifiedService, canisterId} = createServices<ContractService>({
            options: {
                ...options,
                callTransform: undefined,
                queryTransform: undefined
            },
            idlFactory,
            certifiedIdlFactory: idlFactory
        });

        return new ContractAnonymousCanister(canisterId, service, certifiedService);
    }

    getContractOwner = async () => {
        return await this.caller({}).get_contract_owner({});
    };
}
