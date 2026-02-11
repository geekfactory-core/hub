import {isNullish} from '@dfinity/utils';
import {ContractTemplateProvider} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import {extractValidPositiveBigInt} from 'frontend/src/utils/core/number/transform';
import {useMemo} from 'react';
import {Navigate, Route} from 'react-router';
import {useMatch} from 'react-router-dom';
import {RootRoutes} from '../../widgets/RootRoutes';
import {DeploymentEntryPoint} from '../deployment/DeploymentEntryPoint';
import {PATH_CONTRACT_DEPLOYMENT, PATH_CONTRACT_DEPLOYMENTS, PATH_CONTRACT_TEMPLATE, PATH_CONTRACT_TEMPLATES, PATH_HOME} from '../skeleton/Router';
import {InnerRouteContentWrapper} from '../skeleton/SkeletonContentEntryPoint';
import {ContractTemplatePage} from './ContractTemplatePage';
import {ContractTemplatePreloader} from './ContractTemplatePreloader';
import {ContractDeploymentsEntryPoint} from './deployments/ContractDeploymentsEntryPoint';

export const ContractTemplateEntryPoint = () => {
    const contractTemplateId = useCurrentContractTemplateIdFromURL();

    if (isNullish(contractTemplateId)) {
        return <Navigate to={PATH_HOME} />;
    }

    return (
        <ContractTemplateProvider contractTemplateId={contractTemplateId} key={contractTemplateId.toString()}>
            <ContractTemplatePreloader>
                <RootRoutes>
                    <Route
                        path={PATH_CONTRACT_DEPLOYMENTS}
                        element={
                            <InnerRouteContentWrapper childComponentName="Deployments">
                                <ContractDeploymentsEntryPoint />
                            </InnerRouteContentWrapper>
                        }
                    />
                    <Route
                        path={`${PATH_CONTRACT_DEPLOYMENT}/*`}
                        element={
                            <InnerRouteContentWrapper childComponentName="Deployment">
                                <DeploymentEntryPoint />
                            </InnerRouteContentWrapper>
                        }
                    />
                    <Route
                        path={PATH_CONTRACT_TEMPLATE}
                        element={
                            <InnerRouteContentWrapper childComponentName="ContractTemplate">
                                <ContractTemplatePage />
                            </InnerRouteContentWrapper>
                        }
                    />
                    <Route path="*" element={<Navigate to={PATH_CONTRACT_TEMPLATES} />} />
                </RootRoutes>
            </ContractTemplatePreloader>
        </ContractTemplateProvider>
    );
};

const useCurrentContractTemplateIdFromURL = () => {
    const match = useMatch(`${PATH_CONTRACT_TEMPLATE}/*`);
    const uid = match?.params.contractTemplateId;
    return useMemo(() => {
        return extractValidPositiveBigInt(uid);
    }, [uid]);
};
