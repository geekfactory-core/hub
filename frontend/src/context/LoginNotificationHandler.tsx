import PubSub from 'pubsub-js';
import {useCallback, useEffect} from 'react';
import {Canisters, SESSION_TIME_TO_LIVE_MILLIS} from '../constants';
import {millisToNanos} from '../utils/core/date/constants';
import {IS_DEV_ENVIRONMENT} from '../utils/env';
import {INTERNET_IDENTITY_URL} from '../utils/ic/constants';
import {useAuthContext} from './auth/AuthProvider';
import {applicationLogger} from './logger/logger';
import {caughtErrorMessage} from './logger/loggerConstants';

const AUTH_LOGIN_IN_NOTIFICATION = 'AUTH_LOGIN_IN_NOTIFICATION';

const maxTimeToLiveNanos = millisToNanos(SESSION_TIME_TO_LIVE_MILLIS);

const derivationOrigin = IS_DEV_ENVIRONMENT ? undefined : `https://${Canisters.hubFrontend}.icp0.io`;

export const LoginNotificationHandler = () => {
    const {isAuthenticated, isAuthenticating, login} = useAuthContext();

    const tryToLogin = useCallback(
        async (identityProvider: string) => {
            try {
                if (isAuthenticated || isAuthenticating) {
                    /**
                     * skip
                     */
                    return;
                }
                await login({
                    identityProvider,
                    maxTimeToLive: maxTimeToLiveNanos,
                    allowPinAuthentication: false,
                    derivationOrigin
                });
            } catch (e) {
                applicationLogger.error(caughtErrorMessage('LoginNotificationHandler:'), e);
            }
        },
        [isAuthenticated, isAuthenticating, login]
    );

    useEffect(() => {
        const token = PubSub.subscribe(AUTH_LOGIN_IN_NOTIFICATION, () => {
            tryToLogin(INTERNET_IDENTITY_URL);
        });
        return () => {
            PubSub.unsubscribe(token);
        };
    }, [tryToLogin]);

    return null;
};

export const sendLoginNotification = () => {
    PubSub.publish(AUTH_LOGIN_IN_NOTIFICATION);
};
