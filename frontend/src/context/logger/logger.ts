import {Logger, defaultListener} from 'frontend/src/utils/logger/Logger';

export const applicationLogger = new Logger('[App]', {
    includeCallerLocation: false
});
applicationLogger.addListener(defaultListener);

export const authLogger = applicationLogger.createChild('[Auth]');
export const apiLogger = applicationLogger.createChild('[API]');
export const walletLogger = applicationLogger.createChild('[Wallet]');
