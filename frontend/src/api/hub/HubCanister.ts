import type {Principal} from '@dfinity/principal';
import type {CanisterOptions, QueryParams} from '@dfinity/utils';
import {Canister, createServices} from '@dfinity/utils';
import {
    idlFactory,
    type _SERVICE,
    type CancelDeploymentArgs,
    type DeployContractArgs,
    type DeploymentFilter,
    type GetContractTemplatesArgs,
    type GetDeploymentEventsArgs,
    type GetDeploymentsArgs,
    type GetHubEventsArgs,
    type InitializeContractCertificateArgs,
    type ObtainContractCertificateArgs,
    type ProcessDeploymentArgs,
    type ValidateContractCertificateArgs
} from 'src/declarations/hub/hub.did.js';
import {idlFactory as idlFactory_certified} from 'src/declarations/hub_certified/hub.did.js';
import {hasProperty} from '../../utils/core/typescript/typescriptAddons.js';
import {applyCallConfig, getCanisterCallConfig, type QueryParamsWithCanisterId} from '../../utils/ic/api/canisterServiceUtils.js';

type HubService = _SERVICE;
interface HubCanisterOptions<T> extends Omit<CanisterOptions<T>, 'canisterId'> {
    canisterId: Principal;
}

export class HubCanister extends Canister<HubService> {
    static create(options: HubCanisterOptions<HubService>) {
        const {service, certifiedService, canisterId} = createServices<HubService>({
            options: {
                ...options,
                callTransform: undefined,
                queryTransform: undefined
            },
            idlFactory,
            certifiedIdlFactory: idlFactory_certified
        });

        return new HubCanister(canisterId, service, certifiedService);
    }

    getContractActivationCode = async (deploymentId: bigint) => {
        return await this.caller({}).get_contract_activation_code({deployment_id: deploymentId});
    };

    deployContract = async (params: DeployContractArgs) => {
        return await this.caller({}).deploy_contract(params);
    };

    cancelDeployment = async (params: CancelDeploymentArgs) => {
        return await this.caller({}).cancel_deployment(params);
    };

    processDeployment = async (params: ProcessDeploymentArgs) => {
        return await this.caller({}).process_deployment(params);
    };

    obtainContractCertificate = async (params: ObtainContractCertificateArgs) => {
        return await this.caller({}).obtain_contract_certificate(params);
    };

    initializeContractCertificate = async (params: InitializeContractCertificateArgs) => {
        return await this.caller({}).initialize_contract_certificate(params);
    };

    retryGenerateContractCertificate = async (params: ProcessDeploymentArgs) => {
        return await this.caller({}).retry_generate_contract_certificate(params);
    };
}

type GetContractTemplateArgs = {contractTemplateId: bigint};
type GetContractTemplateParams = GetContractTemplateArgs & QueryParams;

type GetDeploymentArgs = {deploymentId: bigint} | {deploymentCanisterId: Principal} | {deploymentCanisterURL: string} | {activeByDeployer: Principal};
export type GetDeploymentParams = GetDeploymentArgs & QueryParams;

export type GetDeploymentsParams = GetDeploymentsArgs & QueryParams;

export type GetCanisterStatusParams = QueryParamsWithCanisterId;

export class HubAnonymousCanister extends Canister<HubService> {
    static create(options: HubCanisterOptions<HubService>) {
        const {service, certifiedService, canisterId} = createServices<HubService>({
            options: {
                ...options,
                callTransform: undefined,
                queryTransform: undefined
            },
            idlFactory,
            certifiedIdlFactory: idlFactory_certified
        });

        return new HubAnonymousCanister(canisterId, service, certifiedService);
    }

    getContractTemplate = async (params: GetContractTemplateParams) => {
        return await this.caller(params).get_contract_template({contract_template_id: params.contractTemplateId});
    };

    getContractTemplates = async (params: GetContractTemplatesArgs) => {
        return await this.caller({}).get_contract_templates(params);
    };

    getDeployment = async (params: GetDeploymentParams) => {
        const filter: DeploymentFilter = hasProperty(params, 'deploymentId')
            ? {ByDeploymentId: {deployment_id: params.deploymentId}}
            : hasProperty(params, 'deploymentCanisterId')
              ? {ByContractCanisterId: {canister_id: params.deploymentCanisterId}}
              : hasProperty(params, 'deploymentCanisterURL')
                ? {ByContractCanisterUrl: {canister_url: params.deploymentCanisterURL}}
                : {Active: {deployer: params.activeByDeployer}};
        return await this.caller(params).get_deployment({filter});
    };

    getDeployments = async (params: GetDeploymentsParams) => {
        return await this.caller(params).get_deployments({
            sorting: params.sorting,
            chunk_def: params.chunk_def,
            selector: params.selector
        });
    };

    getDeploymentEvents = async (params: GetDeploymentEventsArgs) => {
        return await this.caller({}).get_deployment_events(params);
    };

    getHubEvents = async (params: GetHubEventsArgs) => {
        return await this.caller({}).get_hub_events(params);
    };

    getCanisterStatus = async (params: GetCanisterStatusParams) => {
        const method = applyCallConfig(this.caller(params).get_canister_status, getCanisterCallConfig(params));
        return await method();
    };

    getConfig = async () => {
        return await this.caller({}).get_config({});
    };

    getAccessRights = async () => {
        return await this.caller({}).get_access_rights({});
    };

    validateContractCertificate = async (params: ValidateContractCertificateArgs) => {
        return await this.caller({}).validate_contract_certificate(params);
    };
}
