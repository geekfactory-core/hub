import type {ApproveParams, IcrcAccount, IcrcBlockIndex} from '@dfinity/ledger-icrc';
import {ICRC27_ACCOUNTS, type IcrcAccounts, type IcrcScopesArray} from '@dfinity/oisy-wallet-signer';
import {IcrcWallet} from '@dfinity/oisy-wallet-signer/icrc-wallet';
import {isNullish, nonNullish} from '@dfinity/utils';
import {compactArray, isEmptyArray} from 'frontend/src/utils/core/array/array';
import {toError} from 'frontend/src/utils/core/error/toError';
import {icrc27AccountToIcrcAccountSafe} from 'frontend/src/utils/ic/account';
import {walletLogger} from '../logger/logger';
import {AbstractWallet, type Options} from './AbstractWallet';
import {InvalidAccountsError, PermissionsNotGrantedError, type WalletType} from './types';

const DEFAULT_URL = 'https://oisy.com/sign';
const DEFAULT_HOST: string | undefined = undefined;

type OnlyOisyAndCustom = Extract<WalletType, 'oisy' | 'custom'>;

export class OisyWallet extends AbstractWallet {
    private wallet: IcrcWallet | null = null;
    private url: string | undefined;

    private disconnectPromise: Promise<never> | null = null;
    private disconnectReject: ((reason?: any) => void) | null = null;

    constructor(type: OnlyOisyAndCustom, url: string | undefined, options: Options) {
        super(type, options);
        this.url = url;
    }

    override get type(): OnlyOisyAndCustom {
        return super.type as OnlyOisyAndCustom;
    }

    get name(): string {
        const result = this.type === 'oisy' ? 'OISY' : 'CUSTOM';
        return result;
    }

    async getAccounts(): Promise<Array<IcrcAccount> | undefined> {
        try {
            const logMessagePrefix = 'OisyWallet.getAccounts:';
            walletLogger.debug(`${logMessagePrefix} connecting to wallet...`);
            const wallet = await this.connectWallet();
            walletLogger.debug(`${logMessagePrefix} connected to wallet`);

            walletLogger.debug(`${logMessagePrefix} granting accounts permission if needed...`);
            await this.grantPermissionIfNeeded(wallet, ICRC27_ACCOUNTS);
            walletLogger.debug(`${logMessagePrefix} accounts permission granted`);

            walletLogger.debug(`${logMessagePrefix} fetching accounts...`);
            const accounts = await this.executeWithDisconnectRace(wallet.accounts());
            walletLogger.debug(`${logMessagePrefix} accounts received`, accounts);

            const icrcAccounts = this.mapToIcrcLedgerAccounts(accounts);
            const icrcAccount = this.getFirstAccount(icrcAccounts);
            this.emitIcrcAccountReceived(icrcAccount);

            walletLogger.debug(`${logMessagePrefix} disconnecting from wallet...`);
            await this.disconnect();
            walletLogger.debug(`${logMessagePrefix} disconnected from wallet`);

            return icrcAccounts;
        } catch (e) {
            const error = toError(e);
            await this.disconnect();
            this.emitError(error);
        }
    }

    async sendApproveTransaction(params: ApproveParams, ledgerCanisterId: string): Promise<{icrcAccount: IcrcAccount; icrcBlockIndex: IcrcBlockIndex}> {
        try {
            const logMessagePrefix = 'OisyWallet.sendApproveTransaction:';
            walletLogger.debug(`${logMessagePrefix} connecting to wallet...`);
            const wallet = await this.connectWallet();
            walletLogger.debug(`${logMessagePrefix} connected to wallet`);

            walletLogger.debug(`${logMessagePrefix} requesting permissions...`);
            const {allPermissionsGranted} = await this.executeWithDisconnectRace(wallet.requestPermissionsNotGranted());
            walletLogger.debug(`${logMessagePrefix} response received`, {allPermissionsGranted});
            if (!allPermissionsGranted) {
                throw new PermissionsNotGrantedError('Not all requested permissions were granted');
            }

            walletLogger.debug(`${logMessagePrefix} fetching accounts...`);
            const accounts = await this.executeWithDisconnectRace(wallet.accounts());
            walletLogger.debug(`${logMessagePrefix} accounts received`, accounts);
            const icrcAccounts = this.mapToIcrcLedgerAccounts(accounts);
            const icrcAccount = this.getFirstAccount(icrcAccounts);
            this.emitIcrcAccountReceived(icrcAccount);

            walletLogger.debug(`${logMessagePrefix} sending approve transaction...`);
            const result: IcrcBlockIndex = await this.executeWithDisconnectRace(
                wallet.approve({
                    owner: icrcAccount.owner.toText(),
                    params,
                    ledgerCanisterId
                })
            );
            walletLogger.debug(`${logMessagePrefix} approve transaction sent`, result);

            walletLogger.debug(`${logMessagePrefix} disconnecting from wallet...`);
            await this.disconnect();
            walletLogger.debug(`${logMessagePrefix} disconnected from wallet`);

            return {icrcAccount, icrcBlockIndex: result};
        } catch (e) {
            const error = toError(e);
            await this.disconnect();
            this.emitError(error);

            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.ensureWalletClosed();
        } catch (e) {
            const error = toError(e);
            this.emitError(error);
        }
    }

    /**
    ==========================================
    Private methods
    ==========================================
    */

    private async executeWithDisconnectRace<T>(operation: Promise<T>): Promise<T> {
        // If disconnectPromise is not created, create a promise that never resolves/rejects
        const disconnectRacePromise = this.disconnectPromise ?? new Promise<never>(() => {});
        return Promise.race([operation, disconnectRacePromise]);
    }

    private async connectWallet(): Promise<IcrcWallet> {
        await this.ensureWalletClosed();

        // Create disconnect promise that can be rejected on unexpected disconnection
        this.disconnectPromise = new Promise<never>((_, reject) => {
            this.disconnectReject = reject;
        });

        walletLogger.debug('OisyWallet.connectWallet: connecting...');
        this.wallet = await IcrcWallet.connect({
            url: this.url ?? DEFAULT_URL,
            host: this.host ?? DEFAULT_HOST,
            onDisconnect: () => {
                walletLogger.debug('OisyWallet.onDisconnect: disconnected');
                this.wallet = null;

                // Reject disconnect promise to interrupt pending operations
                if (this.disconnectReject) {
                    this.disconnectReject(new Error('Wallet disconnected by user'));
                    this.disconnectReject = null;
                }
                this.disconnectPromise = null;
            }
        });
        walletLogger.debug('OisyWallet.connectWallet: connected');

        return this.wallet;
    }

    private async ensureWalletClosed(): Promise<void> {
        if (nonNullish(this.wallet)) {
            await this.wallet.disconnect();
            this.wallet = null;
        }

        // Clear disconnect promises on normal closure
        this.disconnectPromise = null;
        this.disconnectReject = null;
    }

    private async grantPermissionIfNeeded(wallet: IcrcWallet, method: string): Promise<void> {
        const logMessagePrefix = `OisyWallet.grantPermissionIfNeeded[${method}]:`;

        walletLogger.debug(`${logMessagePrefix} checking existing permissions...`);
        const grantedPermissions = await this.executeWithDisconnectRace(wallet.permissions());
        walletLogger.debug(`${logMessagePrefix} existing permissions received`, grantedPermissions);

        const hasPermission = grantedPermissions.some((p) => p.scope.method === method && p.state === 'granted');
        walletLogger.debug(`${logMessagePrefix} has permission: ${hasPermission}`);
        if (hasPermission) {
            return;
        }

        walletLogger.debug(`${logMessagePrefix} requesting permission...`);
        const scopesArray: IcrcScopesArray = await this.executeWithDisconnectRace(
            wallet.requestPermissions({
                params: {
                    scopes: [{method}]
                }
            })
        );
        walletLogger.debug(`${logMessagePrefix} permission response received`, scopesArray);

        const permission = scopesArray.find((v) => v.scope.method === method);
        walletLogger.debug(`${logMessagePrefix} permission granted: ${permission?.state === 'granted'}`);
        if (isNullish(permission) || permission.state !== 'granted') {
            throw new PermissionsNotGrantedError(`${method} permission not granted`);
        }
    }

    private mapToIcrcLedgerAccounts(accounts: IcrcAccounts): Array<IcrcAccount> {
        return compactArray(
            accounts.map((account) => {
                const icrcAccount = icrc27AccountToIcrcAccountSafe(account);
                return isNullish(icrcAccount) ? undefined : icrcAccount;
            })
        );
    }

    private getFirstAccount(accounts: Array<IcrcAccount> | undefined): IcrcAccount {
        if (isEmptyArray(accounts)) {
            throw new InvalidAccountsError('No accounts available from the wallet');
        }
        const firstAccount = accounts[0];
        if (isNullish(firstAccount)) {
            throw new InvalidAccountsError('First account is not a valid ICRC account');
        }
        return firstAccount;
    }
}
