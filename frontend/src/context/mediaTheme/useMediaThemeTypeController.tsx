import {KeyValueStoreFacade} from 'frontend/src/utils/store/KeyValueStore';
import {useEffect, useMemo, useState} from 'react';

const store = KeyValueStoreFacade.createStore('media-theme-');
const THEME_STORAGE_KEY = 'type';

type ThemeType = 'light' | 'dark' | 'system';

type Context = {
    type: ThemeType;
    setType: (type: ThemeType) => void;
};
export function useThemeTypeController(defaultType: ThemeType = 'system'): Context {
    const [type, setType] = useState<ThemeType>(() => {
        const raw = store.get(THEME_STORAGE_KEY);
        return validateThemeType(raw) ? raw : defaultType;
    });

    useEffect(() => {
        store.set(THEME_STORAGE_KEY, type);
    }, [type]);

    /**
     * cross-tab sync
     */
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === store.fullKey(THEME_STORAGE_KEY) && e.newValue != undefined) {
                setType(validateThemeType(e.newValue) ? e.newValue : defaultType);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [defaultType]);

    return useMemo<Context>(() => ({type, setType}), [type]);
}

const validateThemeType = (type: string | undefined): type is ThemeType => {
    if (type == undefined) {
        return false;
    }
    return type == 'light' || type == 'dark' || type == 'system';
};
