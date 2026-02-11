import {IS_DEV_ENVIRONMENT} from 'frontend/src/utils/env';
import {LOCAL_REPLICA_API_HOST} from 'frontend/src/utils/ic/constants';
import {walletLogger} from '../logger/logger';
import {exhaustiveCheckFailedMessage} from '../logger/loggerConstants';
import type {AbstractWallet} from './AbstractWallet';
import {OisyWallet} from './OisyWallet';
import type {WalletType} from './types';

const LOCAL_SIGNIN_URL = 'http://localhost:5173/sign';
export function createWalletInstance(type: WalletType): AbstractWallet | undefined {
    switch (type) {
        case 'oisy': {
            const url = IS_DEV_ENVIRONMENT ? LOCAL_SIGNIN_URL : undefined;
            return new OisyWallet('oisy', url, {
                host: IS_DEV_ENVIRONMENT ? LOCAL_REPLICA_API_HOST : undefined,
                events: getWalletEvents()
            });
        }
        default: {
            const exhaustiveCheck: never = type;
            walletLogger.error(exhaustiveCheckFailedMessage, exhaustiveCheck);
            throw new Error(`createWalletInstance: Unsupported wallet type: ${type}`);
        }
    }
}

const getWalletEvents = () => {
    return {
        onIcrcAccountReceived: (walletType: WalletType, icrcAccount: any) => {
            walletLogger.debug(`WalletInstance[${walletType}]: onIcrcAccountReceived:`, {icrcAccount});
        },
        onError: (walletType: WalletType, error: Error) => {
            walletLogger.error(`WalletInstance[${walletType}]: onError:`, error);
        }
    };
};
