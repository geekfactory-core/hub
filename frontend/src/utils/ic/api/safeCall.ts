import {nonNullish} from '@dfinity/utils';
import {caughtErrorMessage} from 'frontend/src/context/logger/loggerConstants';
import {toError} from '../../core/error/toError';
import {generateUID} from '../../core/uid/uid';
import type {Logger} from '../../logger/Logger';
import type {ExtractResponseError, ExtractResponseOk} from '../did';

type Options = {
    logger?: Logger;
    logMessagePrefix?: string;
    argsToLog?: Array<any>;
};

/**
==========================================
Safe Call Typed
==========================================
*/

type SafeCallTypedResponse<T, E> = {Ok: T} | {Err: E} | {Thrown: Error};

export type ExtractResponseTyped<F extends (...args: Array<any>) => Promise<any>> = F extends (...args: Array<any>) => Promise<infer R>
    ? SafeCallTypedResponse<ExtractResponseOk<R>, ExtractResponseError<R>>
    : never;

export function safeCallTyped<F extends (...args: Array<any>) => Promise<any>>(fn: F, options?: Options): (...args: Parameters<F>) => Promise<ExtractResponseTyped<F>> {
    return async (...args: Parameters<F>): Promise<ExtractResponseTyped<F>> => {
        const {logger, logMessagePrefix = 'safeCallTyped:', argsToLog} = options ?? {};
        const reqId = generateUID();
        const fetchStart = performance.now();
        try {
            logger?.log(`${logMessagePrefix} request`, {reqId}, ...(argsToLog ?? args));
            const response = await fn(...args);
            const fetchDuration = Number.parseFloat((performance.now() - fetchStart).toFixed(2));
            logger?.log(`${logMessagePrefix} response[${fetchDuration}ms]`, {response}, {reqId});
            if (nonNullish(response) && typeof response === 'object') {
                if ('Ok' in response) {
                    return {Ok: response.Ok} as ExtractResponseTyped<F>;
                }
                if ('Err' in response) {
                    return {Err: response.Err} as ExtractResponseTyped<F>;
                }
            }
            throw new Error('unknownResponse');
        } catch (e) {
            const error = toError(e);
            const fetchDuration = Number.parseFloat((performance.now() - fetchStart).toFixed(2));
            logger?.error(caughtErrorMessage(logMessagePrefix), `[${fetchDuration}ms]`, error, {reqId});
            return {Thrown: error} as ExtractResponseTyped<F>;
        }
    };
}

/**
==========================================
Safe Call
==========================================
*/

type SafeCallResponse<T> = {Ok: T} | {Thrown: Error};
type ExtractResponse<F extends (...args: Array<any>) => Promise<any>> = F extends (...args: Array<any>) => Promise<infer R> ? SafeCallResponse<R> : never;

export function safeCall<F extends (...args: Array<any>) => Promise<any>>(fn: F, options?: Options): (...args: Parameters<F>) => Promise<ExtractResponse<F>> {
    return async (...args: Parameters<F>): Promise<ExtractResponse<F>> => {
        const {logger, logMessagePrefix = 'safeCall:', argsToLog} = options ?? {};
        const reqId = generateUID();
        const start = performance.now();
        try {
            logger?.log(`${logMessagePrefix} request`, {reqId}, ...(argsToLog ?? args));
            const result = await fn(...args);
            const duration = Number.parseFloat((performance.now() - start).toFixed(2));
            logger?.log(`${logMessagePrefix} response[${duration}ms]`, {result}, {reqId});
            return {Ok: result} as ExtractResponse<F>;
        } catch (e) {
            const error = toError(e);
            const duration = Number.parseFloat((performance.now() - start).toFixed(2));
            logger?.error(caughtErrorMessage(logMessagePrefix), `[${duration}ms]`, error, {reqId});
            return {Thrown: error} as ExtractResponse<F>;
        }
    };
}
