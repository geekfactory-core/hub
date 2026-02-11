import type {Identity} from '@dfinity/agent';
import {DelegationIdentity} from '@dfinity/identity';
import {isNullish} from '@dfinity/utils';
import {useEffect, useMemo} from 'react';
import {nanosToMillis} from '../utils/core/date/constants';
import {formatDateTime, formatDuration} from '../utils/core/date/format';
import {getSafeTimerTimeout} from '../utils/core/timer/timer';
import {useAuthContext} from './auth/AuthProvider';
import {authLogger} from './logger/logger';
import {delegationExpiredWillLogoutMessage} from './logger/loggerConstants';

const logMessagePrefix = `DelegationExpirationLogger:`;

export const DelegationExpirationLogger = () => {
    const {isAuthenticated, identity, logout} = useAuthContext();

    const willExpireInMillis: number | undefined = useMemo(() => {
        const {delegationExpirationMillis, willExpireInMillis} = parseDelegationExpiration(identity);
        logDelegationExpiration(delegationExpirationMillis, willExpireInMillis);
        return willExpireInMillis;
    }, [identity]);

    useEffect(() => {
        if (!isAuthenticated || isNullish(willExpireInMillis)) {
            return;
        }
        const timeoutMillis = getSafeTimerTimeout(willExpireInMillis);
        authLogger.log(`${logMessagePrefix} schedule logout timer`, {
            timeoutMillis,
            duration: formatDuration(timeoutMillis, {showMillis: true})
        });
        const timerId = window.setTimeout(() => {
            authLogger.log(`${logMessagePrefix} ${delegationExpiredWillLogoutMessage}`);
            logout();
        }, timeoutMillis);
        return () => window.clearTimeout(timerId);
    }, [isAuthenticated, logout, willExpireInMillis]);

    return null;
};

const parseDelegationExpiration = (
    identity: Identity | undefined
): {
    delegationExpirationMillis: number | undefined;
    willExpireInMillis: number | undefined;
} => {
    const delegationExpirationMillis = getDelegationExpirationMillis(identity);
    let willExpireInMillis: number | undefined;
    if (delegationExpirationMillis != undefined) {
        const currentTimeMillis = Date.now();
        willExpireInMillis = delegationExpirationMillis - currentTimeMillis;
    }
    return {
        delegationExpirationMillis,
        willExpireInMillis
    };
};

const getDelegationExpirationMillis = (identity: Identity | undefined): number | undefined => {
    if (identity != undefined && identity instanceof DelegationIdentity) {
        const delegationChain = identity.getDelegation();
        if (delegationChain != undefined) {
            const firstDelegation = delegationChain.delegations[0];
            if (firstDelegation != undefined) {
                return Number(nanosToMillis(firstDelegation.delegation.expiration));
            }
        }
    }
    return undefined;
};

const logDelegationExpiration = (delegationExpirationMillis: number | undefined, willExpireInMillis: number | undefined) => {
    if (delegationExpirationMillis != undefined) {
        const expirationDateLabel = formatDateTime(delegationExpirationMillis);
        if (willExpireInMillis != undefined && willExpireInMillis > 0) {
            authLogger.log(`${logMessagePrefix} delegation will expire in ${formatDuration(willExpireInMillis, {showMillis: true})} at ${expirationDateLabel} UTC`);
        } else {
            authLogger.warn(`${logMessagePrefix} delegation expired at ${expirationDateLabel}`);
        }
    }
};
