import {isNullish} from '@dfinity/utils';
import {AbstractStubPage} from 'frontend/src/components/widgets/stub/AbstractStubPage';
import {useContractBlockStatusContext} from 'frontend/src/context/contractBlock/ContractBlockStatusProvider';
import {i18} from 'frontend/src/i18';
import {memo, type PropsWithChildren, useEffect} from 'react';
import {ContractBlockStatusLoadingErrorPage} from './ContractBlockStatusLoadingErrorPage';

export const ContractBlockStatusPreloader = memo((props: PropsWithChildren) => {
    const {contractBlockDataAvailability, feature, fetchCurrentContractBlockStatus} = useContractBlockStatusContext();

    useEffect(() => {
        fetchCurrentContractBlockStatus();
    }, [fetchCurrentContractBlockStatus]);

    if (!feature.status.loaded) {
        return <AbstractStubPage icon="loading" title={i18.common.loading} subTitle={i18.deployment.stub.loading.description} />;
    }

    if (feature.error.isError) {
        return <ContractBlockStatusLoadingErrorPage />;
    }

    if (isNullish(contractBlockDataAvailability) || contractBlockDataAvailability.type != 'available') {
        return <ContractBlockStatusLoadingErrorPage />;
    }

    return props.children;
});
