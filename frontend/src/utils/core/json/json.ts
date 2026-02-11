type JSONStringifyOptions = {
    serializeError?: boolean;
};
/**
 * Stringify a JSON object with BigInt, TypedArrays, IC types support, and safe fallbacks
 * @param value Value to stringify
 * @param space Space to use for indentation
 * @param options JSONStringifyOptions options. Default: serializeError = false
 */
export const jsonStringify = (value: unknown, space?: string | number, options?: JSONStringifyOptions) => {
    const {serializeError = false} = options || {};

    try {
        return JSON.stringify(
            value,
            (_key, value) => {
                // BigInt
                if (typeof value === 'bigint') {
                    return {type: 'bigint', value: value.toString()};
                }

                // Map
                if (value instanceof Map) {
                    return {
                        type: 'Map',
                        value: Array.from(value.entries())
                    };
                }

                // Set
                if (value instanceof Set) {
                    return {
                        type: 'Set',
                        value: Array.from(value.values())
                    };
                }

                // Uint8Array
                if (value instanceof Uint8Array) {
                    return {
                        type: 'Uint8Array',
                        value: Array.from(value)
                    };
                }

                // BigUint64Array
                if (value instanceof BigUint64Array) {
                    return {
                        type: 'BigUint64Array',
                        value: Array.from(value, (v) => v.toString())
                    };
                }

                // Error
                if (serializeError && value instanceof Error) {
                    return {
                        type: 'Error',
                        name: value.name,
                        message: value.message,
                        stack: value.stack,
                        cause: (value as any).cause ?? undefined
                    };
                }

                // Function
                if (typeof value === 'function') {
                    return '[Function]';
                }

                // Symbol
                if (typeof value === 'symbol') {
                    return value.toString();
                }

                return value;
            },
            space
        );
    } catch (e) {
        const message = e instanceof Error ? e.message : typeof e === 'object' && e != undefined && 'message' in e ? String((e as any).message) : String(e);
        return `[Unserializable: ${message}]`;
    }
};
