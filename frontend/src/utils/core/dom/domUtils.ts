import {clsx} from 'clsx';

export function mergeClassName(...args: Array<string | undefined | null>): string {
    const classList = args.flatMap((arg) => arg?.trim().split(/\s+/) || []).filter(Boolean);

    const unique = Array.from(new Set(classList));

    return clsx(...unique);
}
