import {toError} from '../error/toError';
import {jsonStringify} from '../json/json';

type Task = () => Promise<any>;

class AsyncQueue {
    private queue: Array<Task> = [];
    private running = false;

    enqueue<T>(task: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await task();
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            });
            this.runNext();
        });
    }

    private async runNext() {
        if (this.running || this.queue.length == 0) {
            return;
        }

        this.running = true;
        const task = this.queue.shift();
        if (task) {
            try {
                await task();
            } finally {
                this.running = false;
                this.runNext();
            }
        }
    }
}

type AdvancedOptions<A extends Array<any>> = {
    serializeArguments?: (args: A) => string;
    queue?: AsyncQueue;
};

export function reusePromiseWrapper<A extends Array<any>, R>(fn: (...args: A) => Promise<R>, options: AdvancedOptions<A> = {}): (...args: A) => Promise<R> {
    const cache = new Map<string, Promise<R>>();
    const serializer = options.serializeArguments ?? ((args: A) => jsonStringify(args));
    const queue = options.queue;

    return (...args: A): Promise<R> => {
        let key: string;
        try {
            key = serializer(args);
        } catch (error) {
            throw new Error(`Arguments are not serializable`, {cause: toError(error)});
        }

        const existing = cache.get(key);
        if (existing != undefined) {
            return existing;
        }

        const task = async () => {
            try {
                return await fn(...args);
            } finally {
                cache.delete(key);
            }
        };

        const promise = queue != undefined ? queue.enqueue(task) : task();
        cache.set(key, promise);
        return promise;
    };
}
