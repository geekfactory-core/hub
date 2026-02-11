import {createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren} from 'react';

type ResolvedTheme = 'light' | 'dark';
type ThemeType = ResolvedTheme | 'system';

type Context = {
    /**
     * system theme according to OS settings
     */
    systemTheme: ResolvedTheme;
    /**
     * controlled theme type
     */
    type: ThemeType;
    /**
     * currently resolved theme
     */
    resolvedTheme: ResolvedTheme;

    setType: (type: ThemeType) => void;
    toggleTheme: () => void;
};

const Context = createContext<Context | undefined>(undefined);

export const useMediaTheme = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useMediaTheme must be used within a MediaThemeProvider');
    }
    return context;
};

type Props = {
    /**
     * controlled theme type
     */
    type: ThemeType;
    /**
     * notify parent to change theme type
     */
    onTypeChange: (type: ThemeType) => void;
    /**
     * toggled on <body> when dark is active
     */
    darkClassName?: string;
};

export const MediaThemeProvider = (props: PropsWithChildren<Props>) => {
    const {type, onTypeChange, darkClassName = 'gf-dark', children} = props;

    const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(type));

    const toggleTheme = useCallback(() => {
        onTypeChange(resolvedTheme == 'dark' ? 'light' : 'dark');
    }, [resolvedTheme, onTypeChange]);

    useEffect(() => {
        setResolvedTheme(resolveTheme(type));

        const mediaQueryList = window.matchMedia(matchMediaDarkConstant);
        const handler = () => {
            const currentTheme = mediaQueryList.matches ? 'dark' : 'light';
            setSystemTheme(currentTheme);

            if (type === 'system') {
                setResolvedTheme(currentTheme);
            }
        };

        mediaQueryList.addEventListener('change', handler);
        return () => {
            mediaQueryList.removeEventListener('change', handler);
        };
    }, [type]);

    useEffect(() => {
        applyHtmlClass(resolvedTheme, darkClassName);
    }, [resolvedTheme, darkClassName]);

    const value = useMemo<Context>(
        () => ({
            systemTheme,
            type,
            resolvedTheme,
            /**
             * delegate to parent
             */
            setType: onTypeChange,
            toggleTheme
        }),
        [systemTheme, type, resolvedTheme, onTypeChange, toggleTheme]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

const matchMediaDarkConstant = '(prefers-color-scheme: dark)';

const getSystemTheme = (): ResolvedTheme => {
    return window.matchMedia(matchMediaDarkConstant).matches ? 'dark' : 'light';
};

const resolveTheme = (type: ThemeType): ResolvedTheme => {
    return type == 'system' ? getSystemTheme() : type;
};

function applyHtmlClass(resolvedTheme: ResolvedTheme, className: string): void {
    if (resolvedTheme == 'dark') {
        document.documentElement.classList.add(className);
        document.body.classList.add(className);
    } else {
        document.documentElement.classList.remove(className);
        document.body.classList.remove(className);
    }
}
