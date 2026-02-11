import type {ApproveParams, IcrcAccount, IcrcBlockIndex} from '@dfinity/ledger-icrc';
import {isNullish} from '@dfinity/utils';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {apiLogger} from 'frontend/src/context/logger/logger';
import {caughtErrorMessage, skipMessage} from 'frontend/src/context/logger/loggerConstants';
import {toError} from 'frontend/src/utils/core/error/toError';
import {useFeature, type Feature} from 'frontend/src/utils/core/feature/feature';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {accountToIcrcAccount, encodeIcrcAccountSafe} from 'frontend/src/utils/ic/account';
import {safeCall} from 'frontend/src/utils/ic/api/safeCall';
import {MAINNET_LEDGER_CANISTER_ID_TEXT} from 'frontend/src/utils/ic/constants';
import {useMemo} from 'react';
import {createWalletInstance} from '../wallet';

type Parameters = ApproveParams;

type Context = {
    sendIcrcApproveTransaction: (parameters: Parameters) => Promise<{icrcBlockIndex: IcrcBlockIndex; icrcAccount: IcrcAccount} | undefined>;
    feature: Feature;
};

export const useSendIcrcApproveTransaction = () => {
    const {isAuthenticated} = useAuthContext();
    const [feature, updateFeature] = useFeature();

    const sendIcrcApproveTransaction = useMemo<Context['sendIcrcApproveTransaction']>(
        () =>
            reusePromiseWrapper(async (parameters: Parameters) => {
                const logMessagePrefix = `useSendIcrcApproveTransaction:`;
                try {
                    updateFeature({status: {inProgress: true}});

                    if (!isAuthenticated) {
                        apiLogger.debug(skipMessage(logMessagePrefix, 'not authenticated'));
                        return;
                    }

                    const wallet = createWalletInstance('oisy');
                    if (isNullish(wallet)) {
                        apiLogger.debug(skipMessage(logMessagePrefix, 'no wallet'));
                        return;
                    }

                    const call = safeCall(wallet.sendApproveTransaction.bind(wallet), {
                        logger: apiLogger,
                        logMessagePrefix,
                        argsToLog: [
                            {
                                ...parameters,
                                spender: encodeIcrcAccountSafe(accountToIcrcAccount(parameters.spender))
                            }
                        ]
                    });
                    const response = await call(parameters, MAINNET_LEDGER_CANISTER_ID_TEXT);
                    if (hasProperty(response, 'Ok')) {
                        updateFeature({
                            status: {inProgress: false, loaded: true},
                            error: {isError: false, error: undefined}
                        });
                        return response.Ok;
                    } else {
                        updateFeature({
                            status: {inProgress: false, loaded: true},
                            error: {isError: true, error: response.Thrown}
                        });
                    }
                } catch (e) {
                    apiLogger.error(caughtErrorMessage(logMessagePrefix), e);
                    updateFeature({
                        status: {inProgress: false, loaded: true},
                        error: {isError: true, error: toError(e)}
                    });
                }
            }),
        [updateFeature, isAuthenticated]
    );

    return useMemo<Context>(
        () => ({
            sendIcrcApproveTransaction,
            feature
        }),
        [sendIcrcApproveTransaction, feature]
    );
};
