import type {Identity} from '@dfinity/agent';
import {AuthClient, type AuthClientLoginOptions, type InternetIdentityAuthResponseSuccess} from '@dfinity/auth-client';
import {toError} from 'frontend/src/utils/core/error/toError';

type AuthnMethod = InternetIdentityAuthResponseSuccess['authnMethod'];

export class AuthService {
    private clientRef: AuthClient | undefined;
    private clientPromise: Promise<AuthClient> | undefined;
    private logMessagePrefix: string = 'AuthService:';

    private async getClient(): Promise<AuthClient> {
        if (this.clientRef) {
            return this.clientRef;
        }
        if (this.clientPromise == undefined) {
            this.clientPromise = AuthClient.create({
                idleOptions: {disableIdle: true, disableDefaultIdleCallback: true}
            }).then((c) => {
                this.clientRef = c;
                return c;
            });
        }
        return this.clientPromise;
    }

    async autologin(): Promise<Identity | undefined> {
        if (typeof window === 'undefined') {
            return undefined;
        }
        const client = await this.getClient();
        const isAuthenticated = await client.isAuthenticated();
        if (!isAuthenticated) {
            return undefined;
        }

        const identity = client.getIdentity();
        if (identity.getPrincipal().isAnonymous()) {
            return undefined;
        }
        return identity;
    }

    async login(options?: Partial<AuthClientLoginOptions>): Promise<{identity: Identity; authnMethod: AuthnMethod}> {
        const client = await this.getClient();
        return new Promise((resolve, reject) => {
            const finalOptions: AuthClientLoginOptions = {
                ...options,
                onSuccess: (msg: InternetIdentityAuthResponseSuccess) => {
                    if (msg.authnMethod == 'pin') {
                        const error = new Error(`${this.logMessagePrefix} PIN authentication is not supported`);
                        reject(error);
                        return;
                    }
                    const identity = client.getIdentity();
                    if (identity.getPrincipal().isAnonymous()) {
                        reject(new Error(`${this.logMessagePrefix} Identity is not available (anonymous principal)`));
                        return;
                    }
                    resolve({identity, authnMethod: msg.authnMethod});
                },
                onError: (e) => {
                    reject(toError(e));
                }
            };
            client.login(finalOptions);
        });
    }

    async logout(): Promise<void> {
        const client = await this.getClient();
        await client.logout();
    }

    async isAuthenticated(): Promise<boolean> {
        const client = await this.getClient();
        return client.isAuthenticated();
    }
}
