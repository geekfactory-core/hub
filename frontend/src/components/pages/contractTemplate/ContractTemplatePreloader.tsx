import {isNullish, nonNullish} from '@dfinity/utils';
import {useContractTemplateContext} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import {i18} from 'frontend/src/i18';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import PubSub from 'pubsub-js';
import type {PropsWithChildren} from 'react';
import {memo, useEffect} from 'react';
import {Navigate} from 'react-router-dom';
import {AbstractStubPage} from '../../widgets/stub/AbstractStubPage';
import {PATH_CONTRACT_TEMPLATES} from '../skeleton/Router';
import {ContractTemplateLoadingErrorPage} from './stub/ContractTemplateLoadingErrorPage';

const REFRESH_CURRENT_CONTRACT_TEMPLATE_NOTIFICATION = 'REFRESH_CURRENT_CONTRACT_TEMPLATE_NOTIFICATION';

export const ContractTemplatePreloader = memo((props: PropsWithChildren) => {
    const {contractTemplateInformation, feature, contractTemplateInformationError, fetchContractTemplateInformation} = useContractTemplateContext();

    useEffect(() => {
        fetchContractTemplateInformation();
    }, [fetchContractTemplateInformation]);

    useEffect(() => {
        const token = PubSub.subscribe(REFRESH_CURRENT_CONTRACT_TEMPLATE_NOTIFICATION, () => {
            fetchContractTemplateInformation();
        });
        return () => {
            PubSub.unsubscribe(token);
        };
    }, [fetchContractTemplateInformation]);

    if (!feature.status.loaded) {
        return <AbstractStubPage icon="loading" title={i18.common.loading} subTitle={i18.contractTemplate.stub.loading.description} />;
    }

    if (feature.error.isError) {
        return <ContractTemplateLoadingErrorPage />;
    }

    if (nonNullish(contractTemplateInformationError)) {
        if (hasProperty(contractTemplateInformationError, 'ContractTemplateNotFound')) {
            return <Navigate to={PATH_CONTRACT_TEMPLATES} replace />;
        }
        return <ContractTemplateLoadingErrorPage />;
    }

    if (isNullish(contractTemplateInformation)) {
        return <ContractTemplateLoadingErrorPage />;
    }

    return props.children;
});

export const sendRefreshCurrentContractTemplateNotification = () => {
    PubSub.publish(REFRESH_CURRENT_CONTRACT_TEMPLATE_NOTIFICATION);
};
