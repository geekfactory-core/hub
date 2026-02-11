import type {IcrcAccount} from '@dfinity/ledger-icrc';

export const WalletType = {
    OISY: 'oisy'
} as const;

export type WalletType = (typeof WalletType)[keyof typeof WalletType];

export type WalletEvents = {
    onIcrcAccountReceived: (walletType: WalletType, icrcAccount: IcrcAccount) => void;
    onError: (walletType: WalletType, error: Error) => void;
};

export class PermissionsNotGrantedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PermissionsNotGrantedError';
    }
}

export class InvalidAccountsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidAccountsError';
    }
}
