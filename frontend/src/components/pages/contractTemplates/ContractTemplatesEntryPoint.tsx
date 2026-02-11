import {PAGE_SIZE} from 'frontend/src/constants';
import {ContractTemplatesProvider} from 'frontend/src/context/contractTemplates/ContractTemplatesProvider';
import type {ContractTemplatesSortingKey} from 'src/declarations/hub/hub.did';
import {ContractTemplatesPage} from './ContractTemplatesPage';

export const ContractTemplatesEntryPoint = () => {
    return (
        <ContractTemplatesProvider pageSize={PAGE_SIZE.contractTemplates} mapTableColumnToContractTemplatesSortingKey={mapTableColumnToContractTemplatesSortingKey}>
            <ContractTemplatesPage />
        </ContractTemplatesProvider>
    );
};

export const CONTRACT_TEMPLATES_TABLE__COLUMN_KEY__REGISTERED = 'registered';
export const CONTRACT_TEMPLATES_TABLE__COLUMN_KEY__DEPLOYMENTS = 'deployments';

export const mapTableColumnToContractTemplatesSortingKey = (columnKey: string): ContractTemplatesSortingKey | undefined => {
    switch (columnKey) {
        case CONTRACT_TEMPLATES_TABLE__COLUMN_KEY__REGISTERED:
            return {Registered: null};
        case CONTRACT_TEMPLATES_TABLE__COLUMN_KEY__DEPLOYMENTS:
            return {DeploymentsCount: null};
        default:
            return undefined;
    }
};
