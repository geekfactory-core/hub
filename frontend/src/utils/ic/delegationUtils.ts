import {toError} from '../core/error/toError';

const HINTS_DELEGATION = [
    /delegation.*expired/i,
    /expired.*delegation/i,
    /invalid.*delegation/i,
    /invalid.*signature/i,
    /identity.*(expired|invalid)/i,
    /signature.*(expired|invalid|verification)/i,
    /expiration.*(signature|delegation)/i,
    /authentication.*expired/i
];

export function isDelegationExpired(err: unknown): boolean {
    const msg = toError(err).message.toLowerCase();
    return HINTS_DELEGATION.some((r) => r.test(msg));
}
