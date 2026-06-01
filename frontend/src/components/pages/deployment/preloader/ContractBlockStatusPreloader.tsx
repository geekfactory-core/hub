import {isNullish, nonNullish} from '@dfinity/utils';
import {AbstractStubPage} from 'frontend/src/components/widgets/stub/AbstractStubPage';
import {useContractBlockStatusContext} from 'frontend/src/context/contractBlock/ContractBlockStatusProvider';
import {i18} from 'frontend/src/i18';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {memo, type PropsWithChildren, useEffect} from 'react';
import {Navigate} from 'react-router-dom';
import {RouterPaths} from '../../skeleton/Router';
import {ContractBlockStatusLoadingErrorPage} from './ContractBlockStatusLoadingErrorPage';

export const ContractBlockStatusPreloader = memo((props: PropsWithChildren) => {
    const {contractTemplateId, contractBlockState, feature, fetchContractBlockStatus, responseError} = useContractBlockStatusContext();

    useEffect(() => {
        fetchContractBlockStatus();
    }, [fetchContractBlockStatus]);

    if (!feature.status.loaded) {
        return <AbstractStubPage icon="loading" title={i18.common.loading} subTitle={i18.deployment.stub.loading.description} />;
    }

    if (feature.error.isError) {
        return <ContractBlockStatusLoadingErrorPage />;
    }

    if (nonNullish(responseError)) {
        if (hasProperty(responseError, 'DeploymentNotFound') || hasProperty(responseError, 'ContractCanisterNotFound')) {
            return <Navigate to={RouterPaths.contractTemplate(contractTemplateId.toString())} />;
        }
        return <ContractBlockStatusLoadingErrorPage />;
    }

    if (isNullish(contractBlockState)) {
        return <ContractBlockStatusLoadingErrorPage />;
    }

    return props.children;
});
