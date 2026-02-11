import {PageLoaderComponent} from 'frontend/src/components/widgets/PageLoaderComponent';
import {createContext, type PropsWithChildren, useContext, useEffect} from 'react';
import {useHubConfig} from './useHubConfig';

type Context = ReturnType<typeof useHubConfig>;

const Context = createContext<Context | undefined>(undefined);
export const useConfigDataContext = () => {
    const context = useContext<Context | undefined>(Context);
    if (!context) {
        throw new Error('useConfigDataContext must be used within a ConfigDataProvider');
    }
    return context;
};

export const ConfigDataProvider = (props: PropsWithChildren) => {
    const config = useHubConfig();
    const {
        fetchHubConfig,
        feature: {
            status: {loaded}
        }
    } = config;

    useEffect(() => {
        fetchHubConfig();
    }, [fetchHubConfig]);

    if (!loaded) {
        return <PageLoaderComponent />;
    }

    return <Context.Provider value={config}>{props.children}</Context.Provider>;
};
