import {fromNullable, isNullish} from '@dfinity/utils';
import {Flex, Grid, List, Typography} from 'antd';
import {i18} from 'frontend/src/i18';
import {useMemo} from 'react';
import {Link} from 'react-router-dom';
import {DateTimeComponent} from '../../widgets/DateTimeComponent';
import {CopyableUIDComponent} from '../../widgets/uid/CopyableUIDComponent';
import {DeploymentStatusTagComponent} from '../contractTemplate/deployments/DeploymentStatusTagComponent';
import {RouterPaths} from '../skeleton/Router';
import type {ItemType} from './MyDeploymentsList';

const {useBreakpoint} = Grid;

export const MyDeploymentsListItem = (props: {item: ItemType}) => {
    const {item} = props;

    const breakpoint = useBreakpoint();
    const isSmallScreen = breakpoint.xs;

    const canisterId = useMemo(() => fromNullable(item.information.contract_canister)?.toText(), [item.information.contract_canister]);
    const canisterIdComponent = useMemo(() => {
        if (isNullish(canisterId)) {
            return i18.myDeployments.table.stub.noCanister;
        }
        return <CopyableUIDComponent uid={canisterId} />;
    }, [canisterId]);

    const linkToDeployment = useMemo(
        () => (
            <Link to={RouterPaths.deployment(item.information.contract_template_id.toString(), item.information.deployment_id.toString())} className="gf-underline gf-underline-hover">
                {i18.myDeployments.table.viewDetails}
            </Link>
        ),
        [item.information.contract_template_id, item.information.deployment_id]
    );

    const vertical = isSmallScreen;
    return (
        <List.Item key={item.information.deployment_id.toString()}>
            <Flex vertical className="gf-width-100" gap={8}>
                <Flex style={{columnGap: 16, rowGap: 4}} align="center" wrap>
                    <Typography.Title level={5}>{item.contractTemplateName ?? '-'}</Typography.Title>
                    <DeploymentStatusTagComponent deploymentInformation={item.information} />
                </Flex>
                <Flex gap={16} justify="space-between" align="center">
                    <Flex vertical gap={vertical ? 8 : 0}>
                        <Flex vertical={vertical} gap={vertical ? 0 : 8}>
                            <div>{`${i18.myDeployments.table.canister} ID:`}</div>
                            <div>{canisterIdComponent}</div>
                        </Flex>
                        <Flex vertical={vertical} gap={vertical ? 0 : 8}>
                            <div>{`${i18.myDeployments.table.created}:`}</div>
                            <div>
                                <DateTimeComponent timeMillis={item.information.created} />
                            </div>
                        </Flex>
                    </Flex>
                </Flex>
                {linkToDeployment}
            </Flex>
        </List.Item>
    );
};
