import {HomeOutlined} from '@ant-design/icons';
import {Breadcrumb} from 'antd';
import type {ItemType} from 'antd/es/breadcrumb/Breadcrumb';
import {useMemo} from 'react';
import {Link, useMatch} from 'react-router-dom';
import {i18} from '../i18';
import {isEmptyArray} from '../utils/core/array/array';
import {
    PATH_CONTRACT_DEPLOYMENT,
    PATH_CONTRACT_DEPLOYMENT_EVENTS,
    PATH_CONTRACT_DEPLOYMENTS,
    PATH_CONTRACT_TEMPLATE,
    PATH_CONTRACT_TEMPLATES,
    PATH_HOME,
    PATH_MY_DEPLOYMENTS,
    PATH_STATUS,
    PATH_VALIDATE_CONTRACT,
    RouterPaths
} from './pages/skeleton/Router';

export const AppBreadcrumb = () => {
    const matchContractTemplates = useMatch(PATH_CONTRACT_TEMPLATES);
    const matchContractTemplate = useMatch(PATH_CONTRACT_TEMPLATE);
    const matchContractDeployments = useMatch(PATH_CONTRACT_DEPLOYMENTS);
    const matchContractDeployment = useMatch(PATH_CONTRACT_DEPLOYMENT);
    const matchContractDeploymentEvents = useMatch(PATH_CONTRACT_DEPLOYMENT_EVENTS);
    const matchValidateContract = useMatch(PATH_VALIDATE_CONTRACT);
    const matchMyDeployments = useMatch(PATH_MY_DEPLOYMENTS);
    const matchStatus = useMatch(PATH_STATUS);

    const items: Array<ItemType> | undefined = useMemo(() => {
        const home: ItemType = {
            key: 'home',
            title: (
                <Link to={PATH_HOME}>
                    <HomeOutlined />
                </Link>
            )
        };
        if (matchContractTemplates) {
            return [
                home,
                {
                    key: 'contractTemplates',
                    title: i18.breadcrumb.contractTemplates
                }
            ];
        }
        if (matchContractTemplate) {
            return [
                home,
                {
                    key: 'contractTemplates',
                    title: <Link to={PATH_CONTRACT_TEMPLATES}>{i18.breadcrumb.contractTemplates}</Link>
                },
                {
                    key: 'contractTemplate',
                    title: i18.breadcrumb.contractTemplate
                }
            ];
        }
        if (matchContractDeployments) {
            return [
                home,
                {
                    key: 'contractTemplates',
                    title: <Link to={PATH_CONTRACT_TEMPLATES}>{i18.breadcrumb.contractTemplates}</Link>
                },
                {
                    key: 'contractTemplate',
                    title: <Link to={RouterPaths.contractTemplate(matchContractDeployments.params.contractTemplateId ?? '')}>{i18.breadcrumb.contractTemplate}</Link>
                },
                {
                    key: 'deployments',
                    title: i18.breadcrumb.deployments
                }
            ];
        }
        if (matchContractDeployment) {
            return [
                home,
                {
                    key: 'contractTemplates',
                    title: <Link to={PATH_CONTRACT_TEMPLATES}>{i18.breadcrumb.contractTemplates}</Link>
                },
                {
                    key: 'contractTemplate',
                    title: <Link to={RouterPaths.contractTemplate(matchContractDeployment.params.contractTemplateId ?? '')}>{i18.breadcrumb.contractTemplate}</Link>
                },
                {
                    key: 'deployments',
                    title: <Link to={RouterPaths.contractDeployments(matchContractDeployment.params.contractTemplateId ?? '')}>{i18.breadcrumb.deployments}</Link>
                },
                {
                    key: 'deployment',
                    title: i18.breadcrumb.deployment
                }
            ];
        }
        if (matchContractDeploymentEvents) {
            return [
                home,
                {
                    key: 'contractTemplates',
                    title: <Link to={PATH_CONTRACT_TEMPLATES}>{i18.breadcrumb.contractTemplates}</Link>
                },
                {
                    key: 'contractTemplate',
                    title: <Link to={RouterPaths.contractTemplate(matchContractDeploymentEvents.params.contractTemplateId ?? '')}>{i18.breadcrumb.contractTemplate}</Link>
                },
                {
                    key: 'deployments',
                    title: <Link to={RouterPaths.contractDeployments(matchContractDeploymentEvents.params.contractTemplateId ?? '')}>{i18.breadcrumb.deployments}</Link>
                },
                {
                    key: 'deployment',
                    title: (
                        <Link to={RouterPaths.deployment(matchContractDeploymentEvents.params.contractTemplateId ?? '', matchContractDeploymentEvents.params.deploymentId ?? '')}>
                            {i18.breadcrumb.deployment}
                        </Link>
                    )
                },
                {
                    key: 'events',
                    title: i18.breadcrumb.events
                }
            ];
        }
        if (matchValidateContract) {
            return [
                home,
                {
                    key: 'validateContract',
                    title: i18.breadcrumb.validateContract
                }
            ];
        }
        if (matchMyDeployments) {
            return [
                home,
                {
                    key: 'myDeployments',
                    title: i18.breadcrumb.myDeployments
                }
            ];
        }
        if (matchStatus) {
            return [
                home,
                {
                    key: 'status',
                    title: i18.breadcrumb.status
                }
            ];
        }
        return undefined;
    }, [matchContractTemplates, matchContractTemplate, matchContractDeployments, matchContractDeployment, matchContractDeploymentEvents, matchValidateContract, matchMyDeployments, matchStatus]);

    if (isEmptyArray(items)) {
        return null;
    }

    return (
        <div className="skBreadcrumbRow">
            <Breadcrumb separator=">" items={items} />
        </div>
    );
};
