import {isNullish} from '@dfinity/utils';
import {PrimaryButton} from 'frontend/src/components/widgets/button/PrimaryButton';
import {ExternalLink} from 'frontend/src/components/widgets/ExternalLink';
import {useConfigDataContext} from 'frontend/src/context/hub/config/ConfigDataProvider';
import {i18} from 'frontend/src/i18';
import {useMemo} from 'react';
import {useContractStatusContext} from '../context/ContractStatusProvider';

export const LinkToContractComponent = () => {
    const {contractDeploymentState} = useContractStatusContext();
    const {buildContractURL} = useConfigDataContext();
    const href = useMemo(() => {
        if (contractDeploymentState?.type != 'success') {
            return undefined;
        }
        return buildContractURL(contractDeploymentState.contractCanisterId);
    }, [contractDeploymentState, buildContractURL]);

    if (isNullish(href)) {
        return null;
    }

    return (
        <ExternalLink href={href}>
            <PrimaryButton block>{i18.deployment.goToContract}</PrimaryButton>
        </ExternalLink>
    );
};
