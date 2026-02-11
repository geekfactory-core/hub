import {BASE_EXTERNAL_REPOSITORY_PAGE_URL} from 'frontend/src/constants';
import queryString from 'query-string';
import {generatePath} from 'react-router-dom';

export const PATH_HOME = `/`;

export const PATH_VALIDATE_CONTRACT = `/validate`;

export const PATH_CONTRACT_TEMPLATES = `/templates`;
export const PATH_CONTRACT_TEMPLATE = `${PATH_CONTRACT_TEMPLATES}/:contractTemplateId`;

export const PATH_CONTRACT_DEPLOYMENTS = `${PATH_CONTRACT_TEMPLATE}/contracts`;
export const PATH_CONTRACT_DEPLOYMENT = `${PATH_CONTRACT_DEPLOYMENTS}/:deploymentId`;
export const PATH_CONTRACT_DEPLOYMENT_EVENTS = `${PATH_CONTRACT_DEPLOYMENT}/events`;

export const PATH_MY_DEPLOYMENTS = `/myContracts`;

export const PATH_STATUS = `/status`;

export const RouterPaths = {
    contractTemplate: (contractTemplateId: string) => generatePath(PATH_CONTRACT_TEMPLATE, {contractTemplateId}),
    contractDeployments: (contractTemplateId: string) => generatePath(PATH_CONTRACT_DEPLOYMENTS, {contractTemplateId}),
    deployment: (contractTemplateId: string, deploymentId: string) => generatePath(PATH_CONTRACT_DEPLOYMENT, {contractTemplateId, deploymentId}),
    deploymentEvents: (contractTemplateId: string, deploymentId: string) => generatePath(PATH_CONTRACT_DEPLOYMENT_EVENTS, {contractTemplateId, deploymentId}),
    externalRepositoryPage: () => {
        return externalRepositoryPageUrl('');
    },
    externalTermsOfUsePage: () => {
        return externalRepositoryPageUrl('TERMS.md');
    },
    externalFAQPage: () => {
        return externalRepositoryPageUrl('FAQ.md');
    }
};

const externalRepositoryPageUrl = (page: string) => {
    return queryString.stringifyUrl({url: `${BASE_EXTERNAL_REPOSITORY_PAGE_URL}${page}`}, {skipEmptyString: true});
};
