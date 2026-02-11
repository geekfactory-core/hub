import {isNullish} from '@dfinity/utils';
import {DeploymentProcessor} from 'frontend/src/context/deployment/DeploymentProcessor';
import {DeploymentProvider, useDeploymentContextSafe} from 'frontend/src/context/deployment/DeploymentProvider';
import {DeploymentStateProvider} from 'frontend/src/context/deployment/DeploymentStateProvider';
import {extractValidPositiveBigInt} from 'frontend/src/utils/core/number/transform';
import {useMemo} from 'react';
import {Navigate, Route, useMatch} from 'react-router-dom';
import {RootRoutes} from '../../widgets/RootRoutes';
import {PATH_CONTRACT_DEPLOYMENT, PATH_CONTRACT_DEPLOYMENT_EVENTS, PATH_HOME, RouterPaths} from '../skeleton/Router';
import {InnerRouteContentWrapper} from '../skeleton/SkeletonContentEntryPoint';
import {ContractStatusProvider} from './context/ContractStatusProvider';
import {DeploymentEventsPage} from './deploymentEvents/DeploymentEventsPage';
import {DeploymentPage} from './DeploymentPage';
import {DeploymentPreloader} from './preloader/DeploymentPreloader';

export const DeploymentEntryPoint = () => {
    const deploymentId = useCurrentDeploymentIdFromURL();

    if (isNullish(deploymentId)) {
        return <Navigate to={PATH_HOME} />;
    }

    return (
        <DeploymentProvider deploymentId={deploymentId}>
            <DeploymentPreloader>
                <DeploymentStateProvider>
                    <DeploymentProcessor>
                        <Inner />
                    </DeploymentProcessor>
                </DeploymentStateProvider>
            </DeploymentPreloader>
        </DeploymentProvider>
    );
};

const Inner = () => {
    const {deployment} = useDeploymentContextSafe();
    return (
        <RootRoutes>
            <Route
                path={PATH_CONTRACT_DEPLOYMENT_EVENTS}
                element={
                    <InnerRouteContentWrapper childComponentName="DeploymentEvents">
                        <DeploymentEventsPage />
                    </InnerRouteContentWrapper>
                }
            />
            <Route
                path={PATH_CONTRACT_DEPLOYMENT}
                element={
                    <InnerRouteContentWrapper childComponentName="Deployment">
                        <ContractStatusProvider>
                            <DeploymentPage />
                        </ContractStatusProvider>
                    </InnerRouteContentWrapper>
                }
            />
            <Route path="*" element={<Navigate to={RouterPaths.contractTemplate(deployment.contract_template_id.toString())} />} />
        </RootRoutes>
    );
};

const useCurrentDeploymentIdFromURL = () => {
    const match = useMatch(`${PATH_CONTRACT_DEPLOYMENT}/*`);
    const uid = match?.params.deploymentId;
    return useMemo(() => {
        return extractValidPositiveBigInt(uid);
    }, [uid]);
};
