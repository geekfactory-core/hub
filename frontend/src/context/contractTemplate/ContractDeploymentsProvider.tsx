import type {Principal} from '@dfinity/principal';
import {isNullish, nonNullish, toNullable} from '@dfinity/utils';
import type {TablePaginationConfig} from 'antd';
import {CONTRACT_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED} from 'frontend/src/components/pages/contractTemplate/deployments/ContractDeploymentsEntryPoint';
import {PAGE_SIZE} from 'frontend/src/constants';
import {useDefaultPaginationConfig} from 'frontend/src/hook/useDefaultPaginationConfig';
import {
    getStateSafeValueFromPredefinedArray,
    useRemoteListWithUrlState,
    type ListSortItem,
    type ListState,
    type RemoteDataProvider,
    type RemoteListWithUrlStateOptions,
    type RemoteListWithUrlStateResult
} from 'frontend/src/hook/useRemoteListWithUrlState';
import {getSerializedParamKey} from 'frontend/src/hook/useUrlState';
import {toError} from 'frontend/src/utils/core/error/toError';
import {hasProperty, unionToArray} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {getCanisterPrincipalIfValid, getCanisterPrincipalStringIfValid} from 'frontend/src/utils/ic/principal';
import type {PropsWithChildren} from 'react';
import {createContext, useCallback, useContext, useMemo} from 'react';
import type {DeploymentInformation, DeploymentsSortingKey, GetDeploymentsResult, SortingOrder} from 'src/declarations/hub/hub.did';
import {useAuthContext} from '../auth/AuthProvider';
import {useContractDeployment} from '../deployment/useContractDeployment';
import {useDeployments, type FetchChunkParameters, type FetchChunkParametersSorting} from '../deployments/useDeployments';
import {apiLogger, applicationLogger} from '../logger/logger';
import {useContractTemplateContextSafe} from './ContractTemplateProvider';

const StateKeys = {
    onlyMyDeployments: 'onlyMyDeployments',
    canisterId: 'canisterId'
};

export type OnlyMyDeploymentsSelectValueType = 'true' | 'false';
const allOnlyMyDeploymentsSelectValueTypes = unionToArray<OnlyMyDeploymentsSelectValueType>()('true', 'false');
export const ONLY_MY_DEPLOYMENTS_DEFAULT_VALUE: OnlyMyDeploymentsSelectValueType = 'false';

type RemoteDataItemType = DeploymentInformation;
type DeploymentsListState = {
    onlyMyDeployments?: OnlyMyDeploymentsSelectValueType;
    canisterId?: string;
} & ListState;

type Context = RemoteListWithUrlStateResult<RemoteDataItemType, DeploymentsListState> & {
    initialState: DeploymentsListState;
    pagination: TablePaginationConfig;
};
const Context = createContext<Context | undefined>(undefined);
export const useContractDeploymentsProviderContext = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useContractDeploymentsProviderContext must be used within a ContractDeploymentsProvider');
    }
    return context;
};

export const getDefaultListSortItem = (): ListSortItem => ({
    field: CONTRACT_DEPLOYMENTS_TABLE_COLUMN_KEY__CREATED,
    order: 'descend'
});

type Props = {
    mapTableColumnToDeploymentsSortingKey: (columnKey: string) => DeploymentsSortingKey | undefined;
};

export const ContractDeploymentsProvider = (props: PropsWithChildren<Props>) => {
    const {principal: currentLoggedInPrincipal} = useAuthContext();
    const {contractTemplateId} = useContractTemplateContextSafe();
    const {mapTableColumnToDeploymentsSortingKey} = props;

    const defaultPagination = useDefaultPaginationConfig();

    const {fetchChunk: fetchDeploymentsChunk} = useDeployments();
    const {fetchDeployment} = useContractDeployment();

    const remoteDataProvider: RemoteDataProvider<RemoteDataItemType> = useCallback(
        async (listState: DeploymentsListState) => {
            const {currentPage, pageSize, sort, onlyMyDeployments, canisterId} = listState;
            const start = (currentPage - 1) * pageSize;

            const deployer: Principal | undefined = mapOnlyMyDeploymentsToDeployerPrincipal(onlyMyDeployments, currentLoggedInPrincipal);

            const canisterSafe = getCanisterPrincipalIfValid(canisterId);
            if (nonNullish(canisterSafe)) {
                const deploymentByCanisterResponse = await fetchDeployment([{deploymentCanisterId: canisterSafe, certified: false}], {
                    logger: apiLogger,
                    logMessagePrefix: 'ContractDeploymentsProvider.remoteDataProvider:'
                });
                if (hasProperty(deploymentByCanisterResponse, 'Ok')) {
                    const deploymentByCanister = deploymentByCanisterResponse.Ok.deployment;
                    if (isNullish(deploymentByCanister)) {
                        /**
                         * no deployment found
                         */
                        return {data: [], total: 0};
                    }
                    if (nonNullish(deployer) && deploymentByCanister.deployer.compareTo(deployer) != 'eq') {
                        /**
                         * deployer is not the same as the one in the deployment
                         */
                        return {data: [], total: 0};
                    }
                    const data: Array<DeploymentInformation> = [deploymentByCanister];
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

            const defaultSorting: FetchChunkParametersSorting = {key: {DeploymentId: null}, order: {Descending: null}};
            const fetchChunkParameters: FetchChunkParameters = {
                count: pageSize,
                start,
                selector: listParametersFilterToRestParameterSelector(contractTemplateId, deployer),
                sorting: listParametersSortToRestParameterSorting(sort, mapTableColumnToDeploymentsSortingKey) ?? defaultSorting
            };
            const result: GetDeploymentsResult = await fetchDeploymentsChunk(fetchChunkParameters);
            return {
                data: result.deployments,
                total: Number(result.total_count)
            };
        },
        [contractTemplateId, fetchDeploymentsChunk, mapTableColumnToDeploymentsSortingKey, currentLoggedInPrincipal, fetchDeployment]
    );

    const initialState: DeploymentsListState = useMemo(() => {
        return {
            currentPage: 1,
            pageSize: PAGE_SIZE.contractDeployments,
            filters: undefined,
            sort: undefined,
            onlyMyDeployments: ONLY_MY_DEPLOYMENTS_DEFAULT_VALUE
        };
    }, []);

    const listOptions: RemoteListWithUrlStateOptions<DeploymentsListState> = useMemo(() => {
        return {
            initialState,
            serializeStateForAdditionalProperties: (state, defaultState): Record<string, any> => {
                const onlyMyDeploymentsValue = getOnlyMyDeploymentsStateValueSafe(state.onlyMyDeployments);
                const onlyMyDeployments = onlyMyDeploymentsValue != defaultState.onlyMyDeployments ? onlyMyDeploymentsValue : undefined;
                const canisterId = getCanisterPrincipalStringIfValid(state.canisterId);
                return {
                    [StateKeys.onlyMyDeployments]: onlyMyDeployments,
                    [StateKeys.canisterId]: canisterId
                };
            },
            deserializeStateForAdditionalProperties: (query, _defaultState, prefix): Partial<DeploymentsListState> => {
                const onlyMyDeploymentsValue = query[getSerializedParamKey(StateKeys.onlyMyDeployments, prefix)];
                const onlyMyDeployments = getOnlyMyDeploymentsStateValueSafe(onlyMyDeploymentsValue);
                const canisterIdValue = query[getSerializedParamKey(StateKeys.canisterId, prefix)];
                const canisterId = getCanisterPrincipalStringIfValid(canisterIdValue);
                return {
                    onlyMyDeployments,
                    canisterId
                };
            }
        };
    }, [initialState]);

    const remoteListWithUrlState = useRemoteListWithUrlState<RemoteDataItemType>(remoteDataProvider, listOptions, applicationLogger, 'ContractDeploymentsProvider');
    const {listState, listTotalSize} = remoteListWithUrlState;

    const pagination: TablePaginationConfig = useMemo(() => {
        return {
            ...defaultPagination,
            current: listState.currentPage,
            pageSize: listState.pageSize,
            total: listTotalSize
        };
    }, [defaultPagination, listState.currentPage, listState.pageSize, listTotalSize]);

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

const listParametersFilterToRestParameterSelector = (contractTemplateId: bigint, deployer: Principal | undefined): FetchChunkParameters['selector'] => {
    if (nonNullish(deployer)) {
        return {
            ByDeployer: {
                deployer,
                contract_template_id: toNullable(contractTemplateId)
            }
        };
    }
    return {
        ByContractTemplate: {
            contract_template_id: contractTemplateId
        }
    };
};

const listParametersSortToRestParameterSorting = (
    sort: DeploymentsListState['sort'],
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

const mapOnlyMyDeploymentsToDeployerPrincipal = (onlyMyDeployments: OnlyMyDeploymentsSelectValueType | undefined, currentLoggedInPrincipal: Principal | undefined): Principal | undefined => {
    if (onlyMyDeployments === 'true' && nonNullish(currentLoggedInPrincipal)) {
        return currentLoggedInPrincipal;
    }
    return undefined;
};

export const getOnlyMyDeploymentsStateValueSafe = (value_: unknown): OnlyMyDeploymentsSelectValueType | undefined => getStateSafeValueFromPredefinedArray(value_, allOnlyMyDeploymentsSelectValueTypes);
