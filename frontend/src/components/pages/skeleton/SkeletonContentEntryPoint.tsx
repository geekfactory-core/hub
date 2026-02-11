import type {PropsWithChildren} from 'react';
import {Navigate, Route, Routes} from 'react-router';
import {ErrorBoundaryComponent} from '../../widgets/ErrorBoundaryComponent';
import {ContractTemplateEntryPoint} from '../contractTemplate/ContractTemplateEntryPoint';
import {ContractTemplatesEntryPoint} from '../contractTemplates/ContractTemplatesEntryPoint';
import {HomeEntryPoint} from '../home/HomeEntryPoint';
import {MyDeploymentsEntryPoint} from '../myDeployments/MyDeploymentsEntryPoint';
import {StatusEntryPoint} from '../status/StatusEntryPoint';
import {ValidateContractEntryPoint} from '../validate/ValidateContractEntryPoint';
import {PATH_CONTRACT_TEMPLATE, PATH_CONTRACT_TEMPLATES, PATH_HOME, PATH_MY_DEPLOYMENTS, PATH_STATUS, PATH_VALIDATE_CONTRACT} from './Router';

export const SkeletonContentEntryPoint = () => {
    return (
        <Routes>
            <Route
                path={PATH_HOME}
                element={
                    <RouteContentWrapper childComponentName="Home">
                        <HomeEntryPoint />
                    </RouteContentWrapper>
                }
            />
            <Route
                path={`${PATH_CONTRACT_TEMPLATE}/*`}
                element={
                    <RouteContentWrapper childComponentName="ContractTemplate">
                        <ContractTemplateEntryPoint />
                    </RouteContentWrapper>
                }
            />
            <Route
                path={PATH_CONTRACT_TEMPLATES}
                element={
                    <RouteContentWrapper childComponentName="ContractTemplates">
                        <ContractTemplatesEntryPoint />
                    </RouteContentWrapper>
                }
            />
            <Route
                path={PATH_MY_DEPLOYMENTS}
                element={
                    <RouteContentWrapper childComponentName="MyDeployments">
                        <MyDeploymentsEntryPoint />
                    </RouteContentWrapper>
                }
            />

            <Route
                path={PATH_VALIDATE_CONTRACT}
                element={
                    <RouteContentWrapper childComponentName="ValidateContract">
                        <ValidateContractEntryPoint />
                    </RouteContentWrapper>
                }
            />
            <Route
                path={PATH_STATUS}
                element={
                    <RouteContentWrapper childComponentName="Status">
                        <StatusEntryPoint />
                    </RouteContentWrapper>
                }
            />
            <Route path="*" element={<Navigate to={PATH_HOME} />} />
        </Routes>
    );
};

const RouteContentWrapper = (
    props: PropsWithChildren<{
        childComponentName: string;
    }>
) => {
    const {childComponentName} = props;
    return <ErrorBoundaryComponent childComponentName={childComponentName}>{props.children}</ErrorBoundaryComponent>;
};

export const InnerRouteContentWrapper = (
    props: PropsWithChildren<{
        childComponentName: string;
    }>
) => {
    const {childComponentName} = props;
    return <ErrorBoundaryComponent childComponentName={childComponentName}>{props.children}</ErrorBoundaryComponent>;
};
