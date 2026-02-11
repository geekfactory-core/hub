import type {ApproveParams} from '@dfinity/ledger-icrc';
import {isNullish, nonNullish, toNullable} from '@dfinity/utils';
import type {ButtonProps} from 'antd';
import {RouterPaths} from 'frontend/src/components/pages/skeleton/Router';
import {ErrorAlert} from 'frontend/src/components/widgets/alert/ErrorAlert';
import {ErrorMessageText} from 'frontend/src/components/widgets/alert/ErrorMessageText';
import {DEPLOYMENT_ALLOWANCE_EXPIRATION_MULTIPLIER} from 'frontend/src/constants';
import {useSendIcrcApproveTransaction} from 'frontend/src/context/connectedWallet/useSendIcrcApproveTransaction';
import {useDeployContract} from 'frontend/src/context/contractTemplate/useDeployContract';
import {applicationLogger} from 'frontend/src/context/logger/logger';
import {caughtErrorMessage, skipMessage} from 'frontend/src/context/logger/loggerConstants';
import {i18} from 'frontend/src/i18';
import {millisToNanos} from 'frontend/src/utils/core/date/constants';
import {toError} from 'frontend/src/utils/core/error/toError';
import {useFeature, useFError} from 'frontend/src/utils/core/feature/feature';
import {jsonStringify} from 'frontend/src/utils/core/json/json';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {IS_DEBUG_ENABLED} from 'frontend/src/utils/env';
import {icrcAccountToAccount} from 'frontend/src/utils/ic/account';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {accountVariantToLedgerAccount} from 'frontend/src/utils/ic/ledgerAccount';
import {createContext, useCallback, useContext, useMemo, type MouseEvent, type PropsWithChildren, type ReactNode} from 'react';
import {useNavigate} from 'react-router';
import type {DeployContractArgs} from 'src/declarations/hub/hub.did';
import {useRequiredData} from './useRequiredData';

type Context = {
    okButtonProps: ButtonProps;
    cancelButtonProps: ButtonProps;

    onDeployContract: (event: MouseEvent<HTMLElement>) => Promise<void>;
    deploymentActionInProgress: boolean;

    actionErrorPanel: ReactNode;

    requiredData: ReturnType<typeof useRequiredData>;
};

const Context = createContext<Context | undefined>(undefined);
export const useDeployContractModalDataContext = () => {
    const context = useContext<Context | undefined>(Context);
    if (!context) {
        throw new Error('useDeployContractModalDataContext must be used within a DeployContractModalDataProvider');
    }
    return context;
};

type Props = {
    contractTemplateId: bigint;
    onCancelModal: () => void;
};
export const DeployContractModalDataProvider = (props: PropsWithChildren<Props>) => {
    const {contractTemplateId, onCancelModal} = props;

    const navigate = useNavigate();

    const requiredData = useRequiredData(contractTemplateId);
    const {requiredDataState} = requiredData;
    const {refetchAllRequiredData, refetchAllRequiredDataInProgress} = requiredData;

    const {sendIcrcApproveTransaction} = useSendIcrcApproveTransaction();
    const [sendIcrcApproveTransactionError, updateSendIcrcApproveTransactionError] = useFError();

    const [deployContractActionFeature, updateDeployContractActionFeature] = useFeature();
    const deploymentActionInProgress = deployContractActionFeature.status.inProgress;

    const {deployContract, responseError} = useDeployContract();

    const onDeployContract = useCallback(async () => {
        const logMessagePrefix = `onDeployContract:`;
        try {
            if (requiredDataState.type != 'readyToStartDeploymentProcess') {
                applicationLogger.debug(skipMessage(logMessagePrefix, `requiredDataState is not "readyToStartDeploymentProcess"`), {requiredDataState});
                return;
            }

            const {expenses} = requiredDataState;

            updateDeployContractActionFeature({status: {inProgress: true}});

            applicationLogger.debug(`${logMessagePrefix} will try to deploy contract`, {
                contractTemplateId,
                requiredDataState
            });

            /**
            ==========================================
            Approve
            ==========================================
            */

            const {bufferedExpensesAmountUlps, deploymentAllowanceExpirationTimeoutMillis} = expenses;
            const {icrcSpender} = requiredDataState.requiredData;
            const approveParams: ApproveParams = {
                spender: icrcAccountToAccount(icrcSpender),
                amount: bufferedExpensesAmountUlps,
                expires_at: millisToNanos(BigInt(Date.now()) + deploymentAllowanceExpirationTimeoutMillis * DEPLOYMENT_ALLOWANCE_EXPIRATION_MULTIPLIER)
            };
            const approveResult = await sendIcrcApproveTransaction(approveParams);
            if (isNullish(approveResult)) {
                updateSendIcrcApproveTransactionError({isError: true, error: undefined});
                updateDeployContractActionFeature({
                    status: {inProgress: false, loaded: true},
                    error: {isError: false, error: undefined}
                });
                return;
            } else {
                updateSendIcrcApproveTransactionError({isError: false, error: undefined});
            }
            const connectedWalletIcrcAccount = approveResult.icrcAccount;

            /**
             * Deploy contract
             */
            const parameters: DeployContractArgs = {
                contract_template_id: contractTemplateId,
                approved_account: accountVariantToLedgerAccount({icrcAccount: connectedWalletIcrcAccount}),
                subnet_type: toNullable()
            };

            const response = await deployContract(parameters);
            if (hasProperty(response, 'Ok')) {
                const deploymentId = response.Ok.deployment.deployment_id;
                applicationLogger.debug(`${logMessagePrefix} will navigate to deployment`, {deploymentId});
                navigate(RouterPaths.deployment(contractTemplateId.toString(), deploymentId.toString()));
                return;
            } else if (hasProperty(response, 'Err')) {
                throw toError(getICFirstKey(response.Err));
            }
            throw response.Thrown;
        } catch (e) {
            const error = toError(e);
            applicationLogger.error(caughtErrorMessage(logMessagePrefix), error);

            /**
             * fetch all required data in case of any synchronization issues
             */
            await refetchAllRequiredData();

            updateDeployContractActionFeature({
                status: {inProgress: false, loaded: true},
                error: {isError: true, error}
            });
        }
    }, [requiredDataState, updateDeployContractActionFeature, contractTemplateId, deployContract, sendIcrcApproveTransaction, updateSendIcrcApproveTransactionError, navigate, refetchAllRequiredData]);

    const deploymentAllowed = requiredDataState.type == 'readyToStartDeploymentProcess';
    const deploymentPossible = deploymentAllowed && !deploymentActionInProgress && !refetchAllRequiredDataInProgress;

    const okButtonProps: ButtonProps = useMemo(() => {
        const result: ButtonProps = {};
        result.children = i18.contractTemplate.deployModal.okText;
        result.disabled = !deploymentPossible;
        result.loading = deploymentActionInProgress;
        result.className = 'gf-flex-auto';
        result.onClick = async (event: MouseEvent<HTMLElement>) => {
            event.preventDefault();
            event.stopPropagation();
            await onDeployContract();
        };
        return result;
    }, [deploymentPossible, deploymentActionInProgress, onDeployContract]);

    const cancelButtonProps: ButtonProps = useMemo(() => {
        const result: ButtonProps = {};
        result.children = i18.common.button.cancelButton;
        result.disabled = deploymentActionInProgress;
        result.className = 'gf-flex-auto';
        result.onClick = () => {
            onCancelModal();
        };
        return result;
    }, [deploymentActionInProgress, onCancelModal]);

    /**
    ==========================================
    Action Error panel
    ==========================================
    */

    const actionErrorPanel: ReactNode = useMemo(() => {
        let messageText = i18.common.error.unableTo;
        if (sendIcrcApproveTransactionError.isError) {
            const message = <ErrorMessageText message={messageText} errorDebugContext={IS_DEBUG_ENABLED ? sendIcrcApproveTransactionError.error?.message : undefined} />;
            return <ErrorAlert message={message} />;
        } else if (nonNullish(responseError)) {
            if (hasProperty(responseError, 'InsufficientApprovedAccountBalance')) {
                messageText = i18.common.error.insufficientBalance;
            }
            const message = <ErrorMessageText message={messageText} errorDebugContext={IS_DEBUG_ENABLED ? jsonStringify(responseError) : undefined} />;
            return <ErrorAlert message={message} />;
        } else if (deployContractActionFeature.error.isError) {
            const message = <ErrorMessageText message={messageText} errorDebugContext={IS_DEBUG_ENABLED ? deployContractActionFeature.error.error?.message : undefined} />;
            return <ErrorAlert message={message} />;
        }
    }, [deployContractActionFeature.error, sendIcrcApproveTransactionError, responseError]);

    const value = useMemo<Context>(() => {
        return {
            okButtonProps,
            cancelButtonProps,
            onDeployContract,
            deploymentActionInProgress,
            deployContractActionFeature,
            actionErrorPanel,
            requiredData
        };
    }, [okButtonProps, cancelButtonProps, onDeployContract, deploymentActionInProgress, deployContractActionFeature, actionErrorPanel, requiredData]);

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};
