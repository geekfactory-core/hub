import {type Account} from '@dfinity/ledger-icp';
import type {IcrcAccount} from '@dfinity/ledger-icrc';
import {encodeIcrcAccount} from '@dfinity/ledger-icrc';
import type {Subaccount} from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import {base64ToUint8Array, fromNullable, nonNullish, toNullable} from '@dfinity/utils';
import {getPrincipalIfValid} from './principal';

export type AccountVariant = {accountIdentifierHex: string} | {icrcAccount: IcrcAccount};

export const icrcAccountToAccount = (icrcAccount: IcrcAccount): Account => {
    return {
        owner: icrcAccount.owner,
        subaccount: toNullable(icrcAccount.subaccount)
    };
};

export const accountToIcrcAccount = (account: Account): IcrcAccount => {
    return {
        owner: account.owner,
        subaccount: fromNullable(account.subaccount)
    };
};

export const icrc27AccountToIcrcAccountSafe = (account: {owner: string; subaccount?: string | undefined}): IcrcAccount | undefined => {
    try {
        const subAccountUint8Array: Subaccount | undefined = nonNullish(account.subaccount) ? base64ToUint8Array(account.subaccount) : undefined;
        const owner = getPrincipalIfValid(account.owner);
        if (nonNullish(owner)) {
            return {
                owner,
                subaccount: subAccountUint8Array
            };
        }
    } catch {}
};

export const encodeIcrcAccountSafe = (icrcAccount: IcrcAccount | undefined): string | undefined => {
    try {
        if (icrcAccount == undefined) {
            return undefined;
        }
        return encodeIcrcAccount(icrcAccount);
    } catch {}
};
