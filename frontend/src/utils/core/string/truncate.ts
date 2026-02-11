import {isNullish} from '@dfinity/utils';

export const truncateMiddle = (str: string, length: number, ellipsis = '...'): string => {
    if (isNullish(str) || length <= 0) {
        return '';
    }
    if (str.length <= length) {
        return str;
    }

    /**
     * Handle edge case when length is less than ellipsis length
     */
    if (length <= ellipsis.length) {
        return ellipsis.substring(0, length);
    }

    const left = Math.ceil((length - ellipsis.length) / 2);
    const right = Math.floor((length - ellipsis.length) / 2);
    return str.substring(0, left) + ellipsis + str.substring(str.length - right);
};

export const truncateEnd = (str: string, length: number, ellipsis = '...'): string => {
    if (isNullish(str) || length <= 0) {
        return '';
    }
    if (str.length <= length) {
        return str;
    }

    /**
     * Handle edge case when length is less than ellipsis length
     */
    if (length <= ellipsis.length) {
        return ellipsis.substring(0, length);
    }

    return str.substring(0, length - ellipsis.length) + ellipsis;
};
