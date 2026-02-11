interface KeyValueStore {
    isFake(): boolean;
    fullKey(key: string): string;
    set(key: string, data: string): void;
    get(key: string): string | undefined;
    remove(key: string): void;
    clearAll(): void;
    isEmpty(): boolean;
}

export class InMemoryKeyValueStore implements KeyValueStore {
    private items = new Map<string, string>();

    isFake(): boolean {
        return true;
    }

    fullKey(key: string): string {
        return key;
    }

    set(key: string, data: string): void {
        this.items.set(key, data);
    }

    get(key: string): string | undefined {
        return this.items.get(key);
    }

    remove(key: string): void {
        this.items.delete(key);
    }

    clearAll(): void {
        this.items.clear();
    }

    isEmpty(): boolean {
        return this.items.size == 0;
    }
}

export class LocalStorageKeyValueStore implements KeyValueStore {
    private readonly namespace: string;
    private readonly store: Storage;

    constructor(namespace: string, store: Storage) {
        this.namespace = namespace;
        this.store = store;
    }

    isFake(): boolean {
        return false;
    }

    fullKey(key: string): string {
        return `${this.namespace}${key}`;
    }

    set(key: string, data: string): void {
        this.store.setItem(this.fullKey(key), data);
    }

    get(key: string): string | undefined {
        return this.store.getItem(this.fullKey(key)) ?? undefined;
    }

    remove(key: string): void {
        this.store.removeItem(this.fullKey(key));
    }

    clearAll(): void {
        allKeys(this.store, this.namespace).forEach((key) => this.remove(key));
    }

    isEmpty(): boolean {
        return allKeys(this.store, this.namespace).length == 0;
    }
}

export const KeyValueStoreFacade = {
    createStore(namespace: string = 'gf', storageProvider: () => Storage | undefined = grabLocalStorage): KeyValueStore {
        const store = tryGetStorage(storageProvider);
        return store ? new LocalStorageKeyValueStore(namespace, store) : new InMemoryKeyValueStore();
    }
};

const tryGetStorage = (provider: () => Storage | undefined): Storage | undefined => {
    try {
        const storage = provider();
        if (isStorageSupported(storage)) {
            return storage;
        }
    } catch {
        /**
         * Storage access failed
         */
    }
    return undefined;
};

const isStorageSupported = (store?: Storage): boolean => {
    if (!store) {
        return false;
    }

    const testKey = `__kv_sandbox_check__`;
    const original = store.getItem(testKey);

    try {
        store.setItem(testKey, '__probe__');
        const isOk = store.getItem(testKey) === '__probe__';
        if (original === null) {
            store.removeItem(testKey);
        } else {
            store.setItem(testKey, original);
        }
        return isOk;
    } catch {
        return false;
    }
};

const grabLocalStorage = (): Storage | undefined => window.localStorage;

const allKeys = (store: Storage, namespace: string): Array<string> => {
    const result: Array<string> = [];

    for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (key && key.startsWith(namespace)) {
            const rawKey = key.slice(namespace.length);
            result.push(rawKey);
        }
    }

    return result;
};
