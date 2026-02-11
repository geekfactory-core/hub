import {Flex} from 'antd';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {PAGE_SIZE} from 'frontend/src/constants';
import {ContractTemplatesProvider} from 'frontend/src/context/contractTemplates/ContractTemplatesProvider';
import {i18} from 'frontend/src/i18';
import {Link} from 'react-router-dom';
import {mapTableColumnToContractTemplatesSortingKey} from '../../contractTemplates/ContractTemplatesEntryPoint';
import {ContractTemplatesList} from '../../contractTemplates/list/ContractTemplatesList';
import {PATH_CONTRACT_TEMPLATES} from '../../skeleton/Router';

export const LatestContractTemplatesPanel = () => {
    return (
        <ContractTemplatesProvider pageSize={PAGE_SIZE.latestContractTemplates} mapTableColumnToContractTemplatesSortingKey={mapTableColumnToContractTemplatesSortingKey}>
            <PanelCard>
                <Flex vertical gap={16}>
                    <PanelHeader title={i18.home.latestContractTemplates.panelTitle} />
                    <ContractTemplatesList noPagination />
                    <Link to={PATH_CONTRACT_TEMPLATES} className="gf-underline gf-underline-hover">
                        {i18.home.latestContractTemplates.viewAllContractTemplates}
                    </Link>
                </Flex>
            </PanelCard>
        </ContractTemplatesProvider>
    );
};
