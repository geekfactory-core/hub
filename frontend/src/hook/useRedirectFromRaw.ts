import {useEffect} from 'react';

export const useRedirectFromRaw = () => {
    useEffect(() => {
        const currentHost = window.location.host;
        const currentUrl = window.location.href;
        if (currentHost.includes('.raw.icp0.io')) {
            const hostWithoutRaw = currentHost.replace('.raw.icp0.io', '.icp0.io');
            const newUrl = currentUrl.replace(currentHost, hostWithoutRaw);
            window.location.assign(newUrl);
        }
    }, []);
};
