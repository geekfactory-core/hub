import {jsonStringify} from '../core/json/json';

type LogLevel = 'debug' | 'log' | 'warn' | 'error';

export type LogEntry = {
    uid: number;
    level: LogLevel;
    timestampMillis: number;
    prefix: string;
    message: string;
    args: Array<any>;
};

type LogListener = (entry: LogEntry) => void;

class LogDispatcher {
    private listeners = new Set<LogListener>();

    add(listener: LogListener) {
        this.listeners.add(listener);
    }

    remove(listener: LogListener) {
        this.listeners.delete(listener);
    }

    notify(entry: LogEntry) {
        this.listeners.forEach((listener) => {
            try {
                listener(entry);
            } catch (error) {
                console.error('[LogDispatcher] Listener error:', {error});
            }
        });
    }

    clear() {
        this.listeners.clear();
    }
}

class LogStorage {
    private logs: Array<LogEntry> = [];
    private headIndex = 0;
    private nextUid = 1;

    constructor(public maxMessages: number = 1000) {}

    add(entry: LogEntry) {
        entry.uid = this.nextUid++;
        if (this.logs.length < this.maxMessages) {
            this.logs.push(entry);
        } else {
            this.logs[this.headIndex] = entry;
            this.headIndex = (this.headIndex + 1) % this.maxMessages;
        }
    }

    getAll(): Array<LogEntry> {
        if (this.logs.length < this.maxMessages) {
            return [...this.logs];
        }

        return [...this.logs.slice(this.headIndex), ...this.logs.slice(0, this.headIndex)];
    }

    clear() {
        this.logs = [];
        this.headIndex = 0;
        /**
         * Reset nextUid when clearing
         */
        this.nextUid = 1;
    }
}

type LoggerOptions = {
    maxMessages?: number;
    storage?: LogStorage;
    dispatcher?: LogDispatcher;
    includeCallerLocation?: boolean;
};

type CreateChildLoggerOptions = {
    useSameDispatcher?: boolean;
    includeCallerLocation?: boolean;
};
export class Logger {
    private readonly storage: LogStorage;
    private readonly prefix: string;
    private readonly dispatcher: LogDispatcher;
    private readonly includeCallerLocation: boolean;

    constructor(prefix = '', options: LoggerOptions = {}) {
        const {maxMessages = 100000, storage, dispatcher, includeCallerLocation = false} = options;
        this.prefix = joinTrimmedNotEmptyStrings(prefix);
        this.storage = storage ?? new LogStorage(maxMessages);
        this.dispatcher = dispatcher ?? new LogDispatcher();
        this.includeCallerLocation = includeCallerLocation;
    }

    debug(message: string, ...args: Array<any>) {
        this.addMessage('debug', message, args);
    }

    log(message: string, ...args: Array<any>) {
        this.addMessage('log', message, args);
    }

    warn(message: string, ...args: Array<any>) {
        this.addMessage('warn', message, args);
    }

    error(message: string, ...args: Array<any>) {
        this.addMessage('error', message, args);
    }

    createChild(prefix: string, options: CreateChildLoggerOptions = {}): Logger {
        const {useSameDispatcher = true, includeCallerLocation = false} = options;
        const dispatcher = useSameDispatcher ? this.dispatcher : new LogDispatcher();
        return new Logger(joinTrimmedNotEmptyStrings(this.prefix, prefix), {
            storage: this.storage,
            dispatcher,
            includeCallerLocation,
            maxMessages: this.storage.maxMessages
        });
    }

    addListener(listener: LogListener) {
        this.dispatcher.add(listener);
    }

    removeListener(listener: LogListener) {
        this.dispatcher.remove(listener);
    }

    getAllMessages(): Array<LogEntry> {
        return this.storage.getAll();
    }

    clear() {
        this.storage.clear();
    }

    toJSON(serializer?: (entry: LogEntry) => any): Array<any> {
        const logs = this.getAllMessages();
        return serializer ? logs.map(serializer) : logs;
    }

    private addMessage(level: LogLevel, message: string, args: Array<any>) {
        const location = this.includeCallerLocation ? getCallerLocation() : undefined;

        const entry: LogEntry = {
            /**
             * Temporary, will be set by LogStorage
             */
            uid: 0,
            level,
            timestampMillis: Date.now(),
            prefix: this.prefix,
            message: location ? `${message} (${location})` : message,
            args
        };

        this.storage.add(entry);
        this.dispatcher.notify(entry);
    }
}

const joinTrimmedNotEmptyStrings = (...prefix: Array<string>): string => {
    const trimmedPrefix = prefix
        .filter((p) => typeof p === 'string')
        .map((p) => (p as string).trim())
        .filter((p) => p.length > 0);
    return trimmedPrefix.join(' ');
};

export const safeSerializeLogEntry = (
    entry: LogEntry
): {
    uid: number;
    timestamp: number;
    level: LogLevel;
    prefix: string;
    message: string;
    args: Array<string>;
} => {
    const safeArgs = entry.args.map((v) => jsonStringify(v));
    return {
        uid: entry.uid,
        timestamp: entry.timestampMillis,
        level: entry.level,
        prefix: entry.prefix,
        message: entry.message,
        args: safeArgs
    };
};

export const defaultListener: LogListener = (entry) => {
    const date = new Date(entry.timestampMillis).toISOString();
    const message = joinTrimmedNotEmptyStrings(date, entry.level.toUpperCase(), entry.prefix, entry.message);
    switch (entry.level) {
        case 'debug': {
            console.debug(message, ...entry.args);
            break;
        }
        case 'log': {
            console.log(message, ...entry.args);
            break;
        }
        case 'warn': {
            console.warn(message, ...entry.args);
            break;
        }
        case 'error': {
            console.error(message, ...entry.args);
            break;
        }
        default: {
            const exhaustiveCheck: never = entry.level;
            console.log('Unknown log level:', exhaustiveCheck);
        }
    }
};

function getCallerLocation(): string | undefined {
    const stack = new Error().stack;
    if (!stack) {
        return;
    }

    const lines = stack.split('\n');
    /**
     * Skip the first few lines that are not relevant to the caller location
     * 0: Error
     * 1: at getCallerLocation
     * 2: at addMessage
     * 3: at debug / log / warn / error
     * 4: <-- this line is where the logger.method() was called from
     */
    const callerLine = lines[4] || lines[3];
    return callerLine?.trim();
}
