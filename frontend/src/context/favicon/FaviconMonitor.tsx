import {useEffect} from 'react';
import {useMediaTheme} from '../mediaTheme/MediaThemeProvider';

export const FaviconMonitor = ({lightIconFileName, darkIconFileName}: {lightIconFileName: string; darkIconFileName: string}) => {
    const {systemTheme} = useMediaTheme();
    const isSystemDarkModeOn = systemTheme === 'dark';

    useEffect(() => {
        const element = document.getElementById('faviconLink') as HTMLLinkElement;
        if (isSystemDarkModeOn) {
            element.href = darkIconFileName;
        } else {
            element.href = lightIconFileName;
        }
    }, [isSystemDarkModeOn, lightIconFileName, darkIconFileName]);

    return null;
};
