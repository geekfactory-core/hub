import {type PropsWithChildren, useEffect} from 'react';
import {AgentProvider} from '../context/agent/AgentProvider';
import {AppConfigProvider} from '../context/AppConfigProvider';
import {AuthProvider, useAuthContext} from '../context/auth/AuthProvider';
import {CanisterProvider} from '../context/canister/CanisterProvider';
import {DelegationExpirationLogger} from '../context/DelegationExpirationLogger';
import {FaviconMonitor} from '../context/favicon/FaviconMonitor';
import {ConfigDataProvider} from '../context/hub/config/ConfigDataProvider';
import {apiLogger, applicationLogger, authLogger} from '../context/logger/logger';
import {LoginNotificationHandler} from '../context/LoginNotificationHandler';
import {MediaThemeProvider} from '../context/mediaTheme/MediaThemeProvider';
import {useThemeTypeController} from '../context/mediaTheme/useMediaThemeTypeController';
import {useRedirectFromRaw} from '../hook/useRedirectFromRaw';
import {IS_DEV_ENVIRONMENT} from '../utils/env';
import {AppBreadcrumb} from './AppBreadcrumb';
import {ConnectModalRenderer} from './pages/auth/ConnectModalRenderer';
import {SkeletonContentEntryPoint} from './pages/skeleton/SkeletonContentEntryPoint';
import {SkeletonFooterEntryPoint} from './pages/skeleton/SkeletonFooterEntryPoint';
import {SkeletonToolbarEntryPoint} from './pages/skeleton/SkeletonToolbarEntryPoint';
import {ErrorBoundaryComponent} from './widgets/ErrorBoundaryComponent';
import {PageLoaderComponent} from './widgets/PageLoaderComponent';

export const AppEntryPoint = () => {
    useRedirectFromRaw();
    return (
        <MediaThemeWrapper>
            <AuthProvider logger={authLogger}>
                <AgentProviderWrapper>
                    <LoginNotificationHandler />
                    <DelegationExpirationLogger />
                    <DataComponents>
                        <AppRootLayout />
                    </DataComponents>
                </AgentProviderWrapper>
            </AuthProvider>
        </MediaThemeWrapper>
    );
};

const MediaThemeWrapper = (props: PropsWithChildren) => {
    const {type, setType} = useThemeTypeController('system');
    return (
        <MediaThemeProvider type={type} onTypeChange={setType} darkClassName="gf-dark">
            <FaviconMonitor lightIconFileName="/favicon-64.svg" darkIconFileName="/favicon-64-dark.svg" />
            <AppConfigProvider>{props.children}</AppConfigProvider>
        </MediaThemeProvider>
    );
};

const AgentProviderWrapper = ({children}: PropsWithChildren) => {
    const {isReady, principal, accountIdentifierHex} = useAuthContext();
    const currentPrincipalText = principal?.toText() || 'anonymous';
    useEffect(() => {
        if (isReady) {
            applicationLogger.log('Current principal', currentPrincipalText);
            if (accountIdentifierHex != undefined) {
                applicationLogger.log('Current principal main subaccount', accountIdentifierHex);
            }
        }
    }, [principal, currentPrincipalText, isReady, accountIdentifierHex]);

    if (!isReady) {
        return <PageLoaderComponent />;
    }

    return (
        <AgentProvider isDevelopment={IS_DEV_ENVIRONMENT}>
            <CanisterProvider logger={apiLogger}>{children}</CanisterProvider>
        </AgentProvider>
    );
};

const DataComponents = (props: PropsWithChildren) => {
    return (
        <>
            <ConfigDataProvider>{props.children}</ConfigDataProvider>
            <ConnectModalRenderer />
        </>
    );
};

const AppRootLayout = () => {
    return (
        <div className="skStack">
            <div className="skToolbarRow">
                <ErrorBoundaryComponent childComponentName="Toolbar">
                    <SkeletonToolbarEntryPoint />
                </ErrorBoundaryComponent>
            </div>
            <AppBreadcrumb />
            <div className="skContentRow">
                <ErrorBoundaryComponent childComponentName="Content">
                    <SkeletonContentEntryPoint />
                </ErrorBoundaryComponent>
            </div>
            <div className="skFooterRow">
                <ErrorBoundaryComponent childComponentName="Footer">
                    <SkeletonFooterEntryPoint />
                </ErrorBoundaryComponent>
            </div>
        </div>
    );
};
