import {isNullish} from '@dfinity/utils';
import {useCallback, useLayoutEffect, useMemo, useState} from 'react';

export const useWindowSize = (step: number = 50) => {
    const [windowSize, setWindowSize] = useState(() => getCurrentWindowSize(step));

    const handleSize = useCallback(() => setWindowSize(getCurrentWindowSize(step)), [step]);

    useLayoutEffect(() => {
        handleSize();

        window.addEventListener('resize', handleSize);

        return () => window.removeEventListener('resize', handleSize);
    }, [handleSize]);

    return useMemo(() => {
        return {
            width: windowSize.width,
            height: windowSize.height
        };
    }, [windowSize.width, windowSize.height]);
};

const getCurrentWindowSize = (step: number) => ({
    width: getClosestStep(window.innerWidth, step),
    height: getClosestStep(window.innerHeight, step)
});

const getClosestStep = (width: number, step: number | undefined) => {
    if (isNullish(step)) {
        return width;
    }
    return Math.round(width / step) * step;
};
