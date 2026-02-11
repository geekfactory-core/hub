import {useContext, useMemo} from 'react';
import {UNSAFE_RouteContext as RouteContext, Routes} from 'react-router';

/**
 * Hack to be able to render nested routes
 */
export function RootRoutes(props: any) {
    const context = useContext(RouteContext);
    const value = useMemo(
        () => ({
            ...context,
            matches: []
        }),
        [context]
    );
    return (
        <RouteContext.Provider value={value}>
            <Routes {...props} />
        </RouteContext.Provider>
    );
}
