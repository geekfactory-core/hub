import {IS_DEV_ENVIRONMENT} from '../../env';

const prefix = '';
export function wrapWithPrefix<T>(obj: T): T {
    if (!IS_DEV_ENVIRONMENT) {
        return obj;
    }

    const handler: ProxyHandler<any> = {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);

            if (typeof value === 'string') {
                return `${prefix}${value}`;
            }

            if (typeof value === 'function') {
                return new Proxy(value, {
                    apply(targetFn, thisArg, args) {
                        const result = targetFn.apply(thisArg, args);
                        if (typeof result === 'string') {
                            return `${prefix}${result}`;
                        }
                        return result;
                    }
                });
            }

            if (typeof value === 'object' && value != undefined) {
                return new Proxy(value, handler);
            }

            return value;
        }
    };

    return new Proxy(obj, handler);
}
