export const wrapWithTryCatch = <T extends object>(obj: T, errorHandler: (error: any) => Promise<void>): T => {
    if (obj == undefined) {
        return undefined as any;
    }
    return new Proxy(obj, {
        get(target, prop, receiver) {
            const original = Reflect.get(target, prop, receiver);
            if (typeof original === 'function') {
                return async function (...args: Array<any>) {
                    try {
                        return await original.apply(target, args);
                    } catch (e) {
                        await errorHandler(e);
                        throw e;
                    }
                };
            }
            return original;
        }
    });
};
