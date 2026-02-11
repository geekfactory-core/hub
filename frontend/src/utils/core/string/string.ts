export const isNonEmptyString = (value: unknown): value is string => {
    return typeof value === 'string' && value.length > 0;
};

export const trimIfDefined = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmedValue: string = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : undefined;
};
