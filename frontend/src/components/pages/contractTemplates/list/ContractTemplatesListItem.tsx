import {Flex, Typography} from 'antd';
import {RouterPaths} from 'frontend/src/components/pages/skeleton/Router';
import {getContractTemplateBlockedData, getContractTemplateRetiredData} from 'frontend/src/context/contractTemplate/contractUtils';
import {i18} from 'frontend/src/i18';
import {memo, useMemo} from 'react';
import {Link} from 'react-router-dom';
import {DeployContractButton} from '../../contractTemplate/deployContractModal/DeployContractButton';
import type {ItemType} from './ContractTemplatesList';

type Props = {
    item: ItemType;
};
export const ContractTemplatesListItem = memo((props: Props) => {
    const {item} = props;
    const contractTemplateBlocked = getContractTemplateBlockedData(item).type == 'blocked';
    const contractTemplateRetired = getContractTemplateRetiredData(item).type == 'retired';

    const linkToContractTemplate = useMemo(() => RouterPaths.contractTemplate(item.contract_template_id.toString()), [item.contract_template_id]);
    const linkToDeployments = useMemo(() => RouterPaths.contractDeployments(item.contract_template_id.toString()), [item.contract_template_id]);

    return (
        <Flex vertical className="gf-preLine" gap={16}>
            <Flex vertical gap={8}>
                <div>
                    <Link to={linkToContractTemplate}>
                        <Typography.Title level={5}>{item.definition.name}</Typography.Title>
                    </Link>
                </div>
                <Typography.Paragraph className="gf-preWrap">{item.definition.short_description}</Typography.Paragraph>
            </Flex>
            <Flex wrap style={{columnGap: 24, rowGap: 8}} align="center">
                <DeployContractButton targetContractTemplateId={item.contract_template_id} contractTemplateBlocked={contractTemplateBlocked} contractTemplateRetired={contractTemplateRetired} />
                <Link to={linkToContractTemplate} className="gf-underline gf-underline-hover">
                    {i18.contractTemplate.action.details}
                </Link>
                <Link to={linkToDeployments} className="gf-underline gf-underline-hover">
                    {i18.contractTemplate.action.deployments(item.deployments_count.toString())}
                </Link>
            </Flex>
        </Flex>
    );
});
