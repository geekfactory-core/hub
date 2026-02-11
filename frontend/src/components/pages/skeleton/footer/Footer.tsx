import {useMemo} from 'react';

export const Footer = () => {
    const currentYear = useMemo(() => new Date().getFullYear(), []);
    return (
        <div>
            &copy; GEEKFACTORY. <>{currentYear}</> All rights reserved.
        </div>
    );
};
