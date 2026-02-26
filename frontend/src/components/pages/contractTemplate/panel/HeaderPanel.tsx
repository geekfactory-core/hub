import {fromNullable} from '@dfinity/utils';
import {Flex, Typography} from 'antd';
import {RouterPaths} from 'frontend/src/components/pages/skeleton/Router';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {useContractTemplateContextSafe} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import {i18} from 'frontend/src/i18';
import {formatNumber} from 'frontend/src/utils/core/number/format';
import {useMemo} from 'react';
import {Link} from 'react-router-dom';
import {DeployContractButton} from '../deployContractModal/DeployContractButton';

export const HeaderPanel = () => {
    const {
        contractTemplateId,
        contractTemplateInformation: {definition: contractTemplateDefinition, deployments_count: totalDeployments},
        dataAvailability,
        retiredData
    } = useContractTemplateContextSafe();
    const contractTemplateBlocked = dataAvailability.type == 'blocked';
    const contractTemplateRetired = retiredData?.type == 'retired';

    const linkPostfix = useMemo(() => ` (${formatNumber(totalDeployments)})`, [totalDeployments]);

    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <PanelHeader title={contractTemplateDefinition.name} />
                <Typography.Paragraph className="gf-preWrap">{fromNullable(contractTemplateDefinition.long_description)}</Typography.Paragraph>
                <Flex gap={24} align="center">
                    <DeployContractButton targetContractTemplateId={contractTemplateId} contractTemplateBlocked={contractTemplateBlocked} contractTemplateRetired={contractTemplateRetired} />
                    <Link to={RouterPaths.contractDeployments(contractTemplateId.toString())} className="gf-underline gf-underline-hover">
                        {`${i18.contractTemplate.viewDeployments}${linkPostfix}`}
                    </Link>
                </Flex>
            </Flex>
        </PanelCard>
    );
};
