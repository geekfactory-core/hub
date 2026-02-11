import {isNullish} from '@dfinity/utils';
import {useContractTemplateContextSafe} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import {useDeploymentContext} from 'frontend/src/context/deployment/DeploymentProvider';
import {i18} from 'frontend/src/i18';
import {memo, type PropsWithChildren, useEffect} from 'react';
import {Navigate} from 'react-router';
import {AbstractStubPage} from '../../../widgets/stub/AbstractStubPage';
import {RouterPaths} from '../../skeleton/Router';
import {DeploymentLoadingErrorPage} from './DeploymentLoadingErrorPage';

export const DeploymentPreloader = memo((props: PropsWithChildren) => {
    const {contractTemplateId} = useContractTemplateContextSafe();
    const {deployment, feature, fetchCurrentDeployment} = useDeploymentContext();

    useEffect(() => {
        fetchCurrentDeployment();
    }, [fetchCurrentDeployment]);

    if (!feature.status.loaded) {
        return <AbstractStubPage icon="loading" title={i18.common.loading} subTitle={i18.deployment.stub.loading.description} />;
    }

    if (feature.error.isError) {
        return <DeploymentLoadingErrorPage />;
    }

    if (isNullish(deployment)) {
        return <Navigate to={RouterPaths.contractDeployments(contractTemplateId.toString())} replace />;
    }

    if (contractTemplateId != deployment.contract_template_id) {
        /**
         * sync URL params
         */
        return <Navigate to={RouterPaths.deployment(deployment.contract_template_id.toString(), deployment.deployment_id.toString())} />;
    }

    return props.children;
});
