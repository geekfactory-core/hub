import {useEffect, useRef, useState} from 'react';

type UsePageFocusParams = {
    onFocus?: () => void;
    onBlur?: () => void;
    debounceMs?: number;
};

export function usePageFocus({onFocus, onBlur, debounceMs = 100}: UsePageFocusParams) {
    const [isFocused, setIsFocused] = useState(() => document.visibilityState == 'visible' && document.hasFocus());
    const [hasBlurred, setHasBlurred] = useState(false);

    const onFocusRef = useRef(onFocus);
    const onBlurRef = useRef(onBlur);
    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingState = useRef<boolean>(isFocused);

    useEffect(() => {
        onFocusRef.current = onFocus;
        onBlurRef.current = onBlur;
    }, [onFocus, onBlur]);

    useEffect(() => {
        const scheduleStateChange = (nextFocused: boolean) => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }

            pendingState.current = nextFocused;

            debounceTimeout.current = setTimeout(() => {
                setIsFocused((prev) => {
                    if (prev != pendingState.current) {
                        if (pendingState.current) {
                            onFocusRef.current?.();
                        } else {
                            onBlurRef.current?.();
                            setHasBlurred(true);
                        }
                    }
                    return pendingState.current;
                });
            }, debounceMs);
        };

        const handleFocus = () => {
            if (document.visibilityState == 'visible') {
                scheduleStateChange(true);
            }
        };

        const handleBlur = () => {
            scheduleStateChange(false);
        };

        const handleVisibilityChange = () => {
            const visible = document.visibilityState == 'visible' && document.hasFocus();
            scheduleStateChange(visible);
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [debounceMs]);

    return [isFocused, hasBlurred] as const;
}
