import {Principal} from '@dfinity/principal';
import {isNullish} from '@dfinity/utils';
import {trimIfDefined} from '../core/string/string';

export const isCanisterPrincipalValid = (principalText: string | undefined): boolean => isCanisterPrincipal(getPrincipalIfValid(principalText));

export const getCanisterPrincipalIfValid = (principalText: unknown): Principal | undefined => {
    const principal = getPrincipalIfValid(principalText);
    if (isCanisterPrincipal(principal)) {
        return principal;
    }
    return undefined;
};

export const getCanisterPrincipalStringIfValid = (principalText: unknown): string | undefined => {
    return getCanisterPrincipalIfValid(principalText)?.toText();
};

const isCanisterPrincipal = (principal: Principal | undefined): boolean => {
    return getPrincipalLastByte(principal) == 1;
};

export const getPrincipalIfValid = (principalText: unknown): Principal | undefined => {
    const text = trimIfDefined(principalText);
    if (isNullish(text)) {
        return undefined;
    }
    try {
        return Principal.fromText(text);
    } catch {
        return undefined;
    }
};

/**
==========================================
Private functions
==========================================
*/

const getPrincipalLastByte = (principal: Principal | undefined): number | undefined => {
    try {
        if (isNullish(principal)) {
            return undefined;
        }
        const uint8Array = principal.toUint8Array();
        const num = uint8Array[uint8Array.length - 1];
        return isFinite(num) ? num : undefined;
    } catch {
        return undefined;
    }
};
