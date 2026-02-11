import {assertNonNullish} from '@dfinity/utils';
import {caughtErrorMessage} from 'frontend/src/context/logger/loggerConstants';
import {useCallback, useMemo, useState, type Dispatch} from 'react';
import {toError} from '../../core/error/toError';
import {useFeature} from '../../core/feature/feature';
import type {Logger} from '../../logger/Logger';
import type {ExtractResponseError, ExtractResponseOk} from '../did';
import {safeCallTyped, type ExtractResponseTyped} from './safeCall';

/**
==========================================
Public options for call
==========================================
*/

type Options<T, K extends keyof T> = {
    logger?: Logger;
    logMessagePrefix?: string;
    argsToLog?: Array<any>;
    resetErrorOnBeforeRequest?: boolean;
    onBeforeRequest?: () => Promise<void>;
    onResponseOkBeforeExit?: (responseOk: MethodResponseTypedOk<T, K>) => Promise<void>;
    onResponseErrorBeforeExit?: (responseError: MethodResponseTypedError<T, K>) => Promise<void>;
    onThrownErrorBeforeExit?: (error: Error) => Promise<void>;
};

/**
==========================================
Internal method/type helpers
==========================================
*/

type MethodFn<T, K extends keyof T> = T[K] extends (...a: infer P) => Promise<infer R> ? (...a: P) => Promise<R> : never;
type MethodArgs<T, K extends keyof T> = MethodFn<T, K> extends (...a: infer P) => any ? P : never;

type MethodResponseTyped<T, K extends keyof T> = ExtractResponseTyped<MethodFn<T, K>>;
type MethodResponseTypedOk<T, K extends keyof T> = ExtractResponseOk<MethodResponseTyped<T, K>>;
type MethodResponseTypedError<T, K extends keyof T> = ExtractResponseError<MethodResponseTyped<T, K>>;

export type OnlyAsyncMethodNames<T> = {
    [P in keyof T]: T[P] extends (...a: Array<any>) => Promise<any> ? P : never;
}[keyof T];

/**
==========================================
"Macros" (type-level API) to reuse outside
==========================================
*/

/**
 * Args tuple for method K of interface T
 */
type ICArgs<T, K extends OnlyAsyncMethodNames<T>> = MethodArgs<T, K>;

/**
 * Full safe-call response union for method K of T
 */
export type ICResponse<T, K extends OnlyAsyncMethodNames<T>> = MethodResponseTyped<T, K>;

/**
 * Ok and Err branches
 */
type ICOk<T, K extends OnlyAsyncMethodNames<T>> = MethodResponseTypedOk<T, K>;
export type ICErr<T, K extends OnlyAsyncMethodNames<T>> = MethodResponseTypedError<T, K>;

/**
 * Options forwarded to safeCallTyped/wrapper
 */
type ICOptions<T, K extends OnlyAsyncMethodNames<T>> = Options<T, K>;

/**
 * Signature of the "call" function returned by the hook
 */
export type ICCall<T, K extends OnlyAsyncMethodNames<T>> = (args: ICArgs<T, K>, options?: ICOptions<T, K>) => Promise<ICResponse<T, K>>;

/**
 * Full return shape of the hook (useful for contexts)
 */
export type ICHookReturn<T, K extends OnlyAsyncMethodNames<T>> = {
    call: ICCall<T, K>;
    data: ICOk<T, K> | undefined;
    setData: Dispatch<ICOk<T, K> | undefined>;
    responseError: ICErr<T, K> | undefined;
    setResponseError: Dispatch<ICErr<T, K> | undefined>;
    feature: ReturnType<typeof useFeature>[0];
    updateFeature: ReturnType<typeof useFeature>[1];
    reset: () => void;
    /* eslint-disable */
    /**
     * @example
     * const myAction = useMemo(
     *        () =>
     *            reusePromiseWrapper(
     *                async (parameters: unknown) =>
     *                    wrapWithTryCatch(async () => {
     *                        {
     *                            // ... your code here ...
     *                        }
     *                    }),
     *                {queue: SHARED_PROMISE_QUEUE}
     *            ),
     *        [deps]
     *    );
     */
    /* eslint-enable */
    wrapWithTryCatch: <X>(action: () => Promise<X>, options?: {logger?: Logger}) => Promise<X | undefined>;
};

/**
==========================================
Hook implementation
==========================================
*/

export function useICCallTypedFor<T, K extends OnlyAsyncMethodNames<T>>(getActor: () => Promise<T | undefined>, method: K): ICHookReturn<T, K> {
    const [data, setData] = useState<ICOk<T, K> | undefined>(undefined);
    const [responseError, setResponseError] = useState<ICErr<T, K> | undefined>(undefined);
    const [feature, updateFeature] = useFeature();

    const reset = useCallback(() => {
        setData(undefined);
        setResponseError(undefined);
        updateFeature({
            status: {inProgress: false, loaded: false},
            error: {isError: false, error: undefined}
        });
    }, [updateFeature]);

    const defaultPrefix = useMemo(() => `useICCallTypedFor.${String(method)}`, [method]);

    const wrapWithTryCatch = useCallback(
        async <X>(action: () => Promise<X>, options?: {logger?: Logger}): Promise<X | undefined> => {
            try {
                return await action();
            } catch (e) {
                const error = toError(e);
                options?.logger?.error(caughtErrorMessage(defaultPrefix), error);
                updateFeature({
                    status: {inProgress: false, loaded: true},
                    error: {isError: true, error}
                });
            }
        },
        [defaultPrefix, updateFeature]
    );

    const call = useCallback(
        async (args: ICArgs<T, K>, options?: ICOptions<T, K>): Promise<ICResponse<T, K>> => {
            try {
                const resetErrorOnBeforeRequest = options?.resetErrorOnBeforeRequest ?? true;
                if (resetErrorOnBeforeRequest) {
                    setResponseError(undefined);
                    updateFeature({
                        status: {inProgress: true},
                        error: {isError: false, error: undefined}
                    });
                } else {
                    updateFeature({status: {inProgress: true}});
                }

                await options?.onBeforeRequest?.();

                const actor = await getActor();
                assertNonNullish(actor, 'noActor');

                const fn = actor[method] as unknown as MethodFn<T, K>;
                const wrapped = safeCallTyped<typeof fn>(fn, {
                    ...options,
                    logMessagePrefix: options?.logMessagePrefix ?? defaultPrefix
                });

                const res = await wrapped(...args);

                if ('Ok' in res) {
                    setData(res.Ok as ICOk<T, K>);
                    await options?.onResponseOkBeforeExit?.(res.Ok as ICOk<T, K>);
                    setResponseError(undefined);
                    updateFeature({
                        status: {inProgress: false, loaded: true},
                        error: {isError: false, error: undefined}
                    });
                    return res;
                } else if ('Err' in res) {
                    setData(undefined);
                    await options?.onResponseErrorBeforeExit?.(res.Err as ICErr<T, K>);
                    setResponseError(res.Err as ICErr<T, K>);
                    updateFeature({
                        status: {inProgress: false, loaded: true},
                        error: {isError: false, error: undefined}
                    });
                    return res;
                }

                setData(undefined);
                setResponseError(undefined);
                await options?.onThrownErrorBeforeExit?.(res.Thrown);
                updateFeature({
                    status: {inProgress: false, loaded: true},
                    error: {isError: true, error: res.Thrown}
                });
                return res;
            } catch (e) {
                const error = toError(e);
                options?.logger?.error(caughtErrorMessage(options?.logMessagePrefix ?? defaultPrefix), error);
                const res = {Thrown: error} as ICResponse<T, K>;
                setData(undefined);
                setResponseError(undefined);
                await options?.onThrownErrorBeforeExit?.(error);
                updateFeature({
                    status: {inProgress: false, loaded: true},
                    error: {isError: true, error}
                });
                return res;
            }
        },
        [defaultPrefix, getActor, method, updateFeature]
    );

    return useMemo(
        () => ({
            call: call as ICCall<T, K>,
            data,
            setData: setData as Dispatch<ICOk<T, K> | undefined>,
            responseError,
            setResponseError: setResponseError as Dispatch<ICErr<T, K> | undefined>,
            feature,
            updateFeature,
            reset,
            wrapWithTryCatch
        }),
        [call, data, responseError, feature, updateFeature, reset, wrapWithTryCatch]
    );
}
