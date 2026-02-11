export function toError(input?: unknown): Error {
    if (input instanceof Error) {
        return input;
    }

    let message = 'Unknown error';

    if (input != undefined) {
        if (typeof input === 'object' && Object.prototype.hasOwnProperty.call(input, 'message')) {
            const msg = (input as any).message;
            if (typeof msg === 'string') {
                message = msg;
            }
        } else if (typeof input === 'string') {
            message = input;
        }
    }

    return new Error(message, {cause: input});
}
