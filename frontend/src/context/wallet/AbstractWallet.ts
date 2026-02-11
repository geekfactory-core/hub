import type {ApproveParams, IcrcAccount, IcrcBlockIndex} from '@dfinity/ledger-icrc';
import type {WalletEvents, WalletType} from './types';

export type Options = {
    host?: string;
    events?: Partial<WalletEvents>;
};

export abstract class AbstractWallet {
    private _type: WalletType;
    protected host: string | undefined;
    protected events: Partial<WalletEvents> | undefined;

    constructor(type: WalletType, options: Options) {
        this._type = type;
        this.host = options.host;
        this.events = options.events || {};
    }

    get type(): WalletType {
        return this._type;
    }

    abstract get name(): string;

    abstract getAccounts(): Promise<Array<IcrcAccount> | undefined>;

    abstract sendApproveTransaction(params: ApproveParams, ledgerCanisterId: string): Promise<{icrcAccount: IcrcAccount; icrcBlockIndex: IcrcBlockIndex}>;

    protected emitIcrcAccountReceived(icrcAccount: IcrcAccount): void {
        this.events?.onIcrcAccountReceived?.(this.type, icrcAccount);
    }

    protected emitError(error: Error): void {
        this.events?.onError?.(this.type, error);
    }
}
