import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {useContractTemplateContextSafe} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import type {ReactNode} from 'react';

export const ContractDeploymentPanelHeader = (props: {title: ReactNode}) => {
    const {title} = props;
    const {
        contractTemplateInformation: {
            definition: {name}
        }
    } = useContractTemplateContextSafe();
    return <PanelHeader title={title} description={name} />;
};
