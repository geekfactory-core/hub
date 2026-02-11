/**
 * Returns a promise that resolves after the given duration.
 * @param {number} durationMillis Duration in milliseconds.
 */
export function delayPromise(durationMillis: number) {
    return new Promise((resolve) => setTimeout(resolve, durationMillis));
}

export const promiseAllSettledParallel = <T>(promises: Array<() => Promise<T>>, parallel: number): Promise<Array<PromiseSettledResult<T>>> => {
    return new Promise((resolve, _reject) => {
        /**
         * early resolve for empty input
         */
        if (promises.length == 0) {
            resolve([]);
            return;
        }

        const results: Array<PromiseSettledResult<T>> = new Array(promises.length);
        let promisesInProgress = 0;
        let promiseIndex = 0;

        /**
         * normalize and cap "parallel"
         */
        let limit = Math.floor(parallel);
        if (!Number.isFinite(limit) || limit < 1) {
            limit = 1;
        }
        if (limit > promises.length) {
            limit = promises.length;
        }

        const runNextPromise = () => {
            /**
             * no more promises left to start
             */
            if (promiseIndex >= promises.length) {
                /**
                 * resolve only when all in-flight promises are finished
                 */
                if (promisesInProgress == 0) {
                    resolve(results);
                }
                return;
            }

            const currentIndex = promiseIndex;
            const promiseFactory = promises[promiseIndex];
            promiseIndex++;
            promisesInProgress++;

            const onFinally = () => {
                promisesInProgress--;
                /**
                 * try to start next promise
                 */
                runNextPromise();
            };

            try {
                /**
                 * if promiseFactory throws synchronously, outer catch will handle
                 */
                promiseFactory()
                    .then((result) => {
                        results[currentIndex] = {status: 'fulfilled', value: result};
                    })
                    .catch((error) => {
                        results[currentIndex] = {status: 'rejected', reason: error};
                    })
                    .finally(onFinally);
            } catch (error) {
                /**
                 * synchronous error thrown before returning a Promise
                 */
                results[currentIndex] = {status: 'rejected', reason: error};
                onFinally();
            }
        };

        /**
         * start "limit" promises in parallel
         */
        for (let i = 0; i < limit; i++) {
            runNextPromise();
        }
    });
};
