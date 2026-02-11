import type {Principal} from '@dfinity/principal';
import {assertNonNullish, isNullish, nonNullish, toNullable} from '@dfinity/utils';
import type {TablePaginationConfig} from 'antd';
import {MY_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED} from 'frontend/src/components/pages/myDeployments/MyDeploymentsEntryPoint';
import {PAGE_SIZE} from 'frontend/src/constants';
import {useDefaultPaginationConfig} from 'frontend/src/hook/useDefaultPaginationConfig';
import {
    useRemoteListWithUrlState,
    type ListSortItem,
    type ListState,
    type RemoteDataProvider,
    type RemoteListWithUrlStateOptions,
    type RemoteListWithUrlStateResult
} from 'frontend/src/hook/useRemoteListWithUrlState';
import {getSerializedParamKey} from 'frontend/src/hook/useUrlState';
import {toError} from 'frontend/src/utils/core/error/toError';
import {promiseAllSettledParallel} from 'frontend/src/utils/core/promise/promiseUtils';
import {trimIfDefined} from 'frontend/src/utils/core/string/string';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {safeCallTyped} from 'frontend/src/utils/ic/api/safeCall';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {getCanisterPrincipalIfValid, getCanisterPrincipalStringIfValid} from 'frontend/src/utils/ic/principal';
import type {PropsWithChildren} from 'react';
import {createContext, useCallback, useContext, useMemo} from 'react';
import type {ContractTemplateInformation, DeploymentInformation, DeploymentsSortingKey, GetDeploymentsResult, SortingOrder} from 'src/declarations/hub/hub.did';
import {useAuthContext} from '../auth/AuthProvider';
import {useCanisterContext, type GetHubAnonymousCanister} from '../canister/CanisterProvider';
import {useContractDeployment} from '../deployment/useContractDeployment';
import {useDeployments, type FetchChunkParameters, type FetchChunkParametersSorting} from '../deployments/useDeployments';
import {apiLogger, applicationLogger} from '../logger/logger';

export type DeploymentInformationExt = {
    contractTemplateName: string | undefined;
    information: DeploymentInformation;
};

const StateKeys = {
    canisterId: 'canisterId'
};

export const formRules = {
    filterMinLength: 3,
    filterMaxLength: 30
};

type MyDeploymentsListState = {
    canisterId?: string;
} & ListState;

type RemoteDataItemType = DeploymentInformationExt;
type Context = RemoteListWithUrlStateResult<RemoteDataItemType, MyDeploymentsListState> & {
    initialState: MyDeploymentsListState;
    pagination: TablePaginationConfig;
};
const Context = createContext<Context | undefined>(undefined);
export const useMyDeploymentsProviderContext = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useMyDeploymentsProviderContext must be used within a MyDeploymentsProvider');
    }
    return context;
};

export const getDefaultListSortItem = (): ListSortItem => ({
    field: MY_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED,
    order: 'descend'
});

type Props = {
    mapTableColumnToDeploymentsSortingKey: (columnKey: string) => DeploymentsSortingKey | undefined;
};

export const MyDeploymentsProvider = (props: PropsWithChildren<Props>) => {
    const {principal: currentLoggedInPrincipal} = useAuthContext();
    const {mapTableColumnToDeploymentsSortingKey} = props;
    const {getHubAnonymousCanister} = useCanisterContext();

    const defaultPagination = useDefaultPaginationConfig();

    const {fetchChunk: fetchDeploymentsChunk} = useDeployments();
    const {fetchDeployment} = useContractDeployment();

    const remoteDataProvider: RemoteDataProvider<RemoteDataItemType> = useCallback(
        async (listState: MyDeploymentsListState) => {
            const {currentPage, pageSize, sort, canisterId} = listState;
            const start = (currentPage - 1) * pageSize;

            if (isNullish(currentLoggedInPrincipal)) {
                return undefined;
            }

            const canisterSafe = getCanisterPrincipalIfValid(canisterId);
            if (nonNullish(canisterSafe)) {
                const deploymentByCanisterResponse = await fetchDeployment([{deploymentCanisterId: canisterSafe, certified: false}], {
                    logger: apiLogger,
                    logMessagePrefix: 'MyDeploymentsProvider.remoteDataProvider:'
                });
                if (hasProperty(deploymentByCanisterResponse, 'Ok')) {
                    const deploymentByCanister = deploymentByCanisterResponse.Ok.deployment;
                    if (isNullish(deploymentByCanister)) {
                        /**
                         * no deployment found
                         */
                        return {data: [], total: 0};
                    }
                    if (deploymentByCanister.deployer.compareTo(currentLoggedInPrincipal) != 'eq') {
                        /**
                         * deployer is not the current user
                         */
                        return {data: [], total: 0};
                    }
                    const contractTemplateInfoMap = await fetchContractTemplateInfos(getHubAnonymousCanister, [deploymentByCanister.contract_template_id]);

                    const data: Array<DeploymentInformationExt> = [deploymentByCanister].map((deployment) => {
                        const contractTemplateInfo: ContractTemplateInformation | undefined = contractTemplateInfoMap.get(deployment.contract_template_id.toString());
                        return {
                            contractTemplateName: contractTemplateInfo?.definition.name,
                            information: deployment
                        };
                    });
                    return {data, total: data.length};
                } else if (hasProperty(deploymentByCanisterResponse, 'Err')) {
                    if (hasProperty(deploymentByCanisterResponse.Err, 'DeploymentNotFound')) {
                        /**
                         * no deployment found
                         */
                        return {data: [], total: 0};
                    }
                    throw toError(getICFirstKey(deploymentByCanisterResponse.Err));
                }
                throw deploymentByCanisterResponse.Thrown;
            }

            const defaultSorting: FetchChunkParametersSorting = {
                key: {DeploymentId: null},
                order: {Descending: null}
            };
            const fetchChunkParameters: FetchChunkParameters = {
                count: pageSize,
                start: start,
                selector: listParametersFilterToRestParameterSelector(currentLoggedInPrincipal),
                sorting: listParametersSortToRestParameterSorting(sort, mapTableColumnToDeploymentsSortingKey) ?? defaultSorting
            };
            const result: GetDeploymentsResult = await fetchDeploymentsChunk(fetchChunkParameters);

            const contractTemplateInfoMap = await fetchContractTemplateInfos(
                getHubAnonymousCanister,
                result.deployments.map((deployment) => deployment.contract_template_id)
            );
            const data: Array<DeploymentInformationExt> = result.deployments.map((deployment) => {
                const contractTemplateInfo: ContractTemplateInformation | undefined = contractTemplateInfoMap.get(deployment.contract_template_id.toString());
                return {
                    contractTemplateName: contractTemplateInfo?.definition.name,
                    information: deployment
                };
            });

            return {
                data,
                total: Number(result.total_count)
            };
        },
        [currentLoggedInPrincipal, mapTableColumnToDeploymentsSortingKey, fetchDeploymentsChunk, getHubAnonymousCanister, fetchDeployment]
    );

    const initialState: MyDeploymentsListState = useMemo(() => {
        return {
            currentPage: 1,
            pageSize: PAGE_SIZE.myDeployments,
            filters: undefined,
            sort: undefined
        };
    }, []);

    const listOptions: RemoteListWithUrlStateOptions<MyDeploymentsListState> = useMemo(() => {
        return {
            initialState,
            serializeStateForAdditionalProperties: (state, _defaultState): Record<string, any> => {
                const canisterId = getCanisterPrincipalStringIfValid(state.canisterId);
                return {
                    [StateKeys.canisterId]: canisterId
                };
            },
            deserializeStateForAdditionalProperties: (query, _defaultState, prefix): Partial<MyDeploymentsListState> => {
                const canisterIdValue = query[getSerializedParamKey(StateKeys.canisterId, prefix)];
                const canisterId = getCanisterPrincipalStringIfValid(canisterIdValue);
                return {
                    canisterId
                };
            }
        };
    }, [initialState]);

    const remoteListWithUrlState = useRemoteListWithUrlState<RemoteDataItemType>(remoteDataProvider, listOptions, applicationLogger, 'MyDeploymentsProvider');
    const {listState, listTotalSize, feature, updateListState} = remoteListWithUrlState;
    const {inProgress} = feature.status;

    const pagination: TablePaginationConfig = useMemo(() => {
        return {
            ...defaultPagination,
            disabled: inProgress,
            current: listState.currentPage,
            pageSize: listState.pageSize,
            total: listTotalSize,
            onChange: (page: number, pageSize: number) => {
                updateListState({
                    currentPage: page,
                    pageSize
                });
            }
        };
    }, [defaultPagination, inProgress, listState.currentPage, listState.pageSize, listTotalSize, updateListState]);

    const value: Context = useMemo(
        () => ({
            ...remoteListWithUrlState,
            initialState,
            pagination
        }),
        [remoteListWithUrlState, initialState, pagination]
    );

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};

const listParametersFilterToRestParameterSelector = (deployer: Principal): FetchChunkParameters['selector'] => {
    return {
        ByDeployer: {
            deployer,
            contract_template_id: toNullable()
        }
    };
};

const listParametersSortToRestParameterSorting = (
    sort: MyDeploymentsListState['sort'],
    mapTableColumnToDeploymentsSortingKey: Props['mapTableColumnToDeploymentsSortingKey']
): FetchChunkParameters['sorting'] => {
    const sortItem: ListSortItem | undefined = sort?.[0];
    if (sortItem == undefined) {
        return undefined;
    }
    const sortingKey: DeploymentsSortingKey | undefined = mapTableColumnToDeploymentsSortingKey(sortItem.field);
    const sortingOrder: SortingOrder | undefined = sortItem.order == 'ascend' ? {Ascending: null} : sortItem.order == 'descend' ? {Descending: null} : undefined;

    if (sortingKey == undefined || sortingOrder == undefined) {
        return undefined;
    }
    return {
        key: sortingKey,
        order: sortingOrder
    };
};

export const getFilterStateValueSafe = (queryFilterValue: string | undefined): string | undefined => {
    const trimmedValue = trimIfDefined(queryFilterValue);
    if (isNullish(trimmedValue)) {
        return undefined;
    }
    if (trimmedValue.length < formRules.filterMinLength) {
        return undefined;
    }
    return trimmedValue.substring(0, formRules.filterMaxLength);
};

const fetchContractTemplateInfos = async (getAnonymousHubCanister: GetHubAnonymousCanister, contractTemplateIds: Array<bigint>): Promise<Map<string, ContractTemplateInformation>> => {
    const uniqueContractTemplateIds = Array.from(new Set(contractTemplateIds.map((id) => id.toString()))).map((id) => BigInt(id));
    const responses = await promiseAllSettledParallel(
        uniqueContractTemplateIds.map((contractTemplateId) => () => fetchContractTemplateInformation(getAnonymousHubCanister, contractTemplateId)),
        5
    );
    const infoMap: Map<string, ContractTemplateInformation> = new Map();
    uniqueContractTemplateIds.forEach((contractTemplateId, index) => {
        const response = responses[index];
        if (response.status == 'fulfilled') {
            const contractTemplateResponse = response.value;
            if (hasProperty(contractTemplateResponse, 'Ok')) {
                infoMap.set(contractTemplateId.toString(), contractTemplateResponse.Ok.contract_template);
            }
        }
    });
    return infoMap;
};

const fetchContractTemplateInformation = async (getAnonymousHubCanister: GetHubAnonymousCanister, contractTemplateId: bigint) => {
    const actor = await getAnonymousHubCanister();
    assertNonNullish(actor, 'noActor');

    const call = safeCallTyped(actor.getContractTemplate, {logger: apiLogger, logMessagePrefix: 'MyDeploymentsProvider.fetchContractTemplateInformation:'});
    return await call({contractTemplateId: contractTemplateId, certified: false});
};
