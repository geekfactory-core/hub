import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AccessRight {
  'permissions' : [] | [Array<Permission>],
  'description' : [] | [string],
  'caller' : Principal,
}
export interface AddContractTemplateArgs {
  'contract_template_definition' : ContractTemplateDefinition,
}
export type AddContractTemplateError = { 'GrantNotFound' : null } |
  { 'ContractLongDescriptionIsTooLong' : { 'max_length' : bigint } } |
  { 'ContractShortDescriptionIsTooLong' : { 'max_length' : bigint } } |
  { 'ContractNameIsTooLong' : { 'max_length' : bigint } } |
  { 'PermissionDenied' : null } |
  { 'ContractTemplateNameAlreadyExists' : null } |
  { 'InvalidWasmLength' : { 'uploaded_length' : bigint } } |
  { 'ContractTemplateWasmAlreadyExists' : null } |
  { 'InvalidWasmHash' : { 'hash' : string } };
export type AddContractTemplateResponse = { 'Ok' : AddContractTemplateResult } |
  { 'Err' : AddContractTemplateError };
export interface AddContractTemplateResult { 'contract_template_id' : bigint }
export interface BlockContractTemplateArgs {
  'contract_template_id' : bigint,
  'reason' : string,
}
export type BlockContractTemplateError = { 'ContractTemplateNotFound' : null } |
  { 'PermissionDenied' : null } |
  { 'ContractTemplateAlreadyBlocked' : null };
export type BlockContractTemplateResponse = { 'Ok' : null } |
  { 'Err' : BlockContractTemplateError };
export interface CancelDeploymentArgs {
  'deployment_id' : bigint,
  'reason' : string,
}
export type CancelDeploymentError = { 'DeploymentNotFound' : null } |
  { 'PermissionDenied' : null } |
  { 'DeploymentWrongState' : null } |
  { 'DeploymentLocked' : { 'lock' : DelayedTimestampMillis } };
export type CancelDeploymentResponse = { 'Ok' : GetDeploymentResult } |
  { 'Err' : CancelDeploymentError };
export interface CanisterMetrics {
  'stable_memory_size' : bigint,
  'cycles' : bigint,
  'heap_memory_size' : bigint,
}
export interface CanisterSettings {
  'initial_cycles' : bigint,
  'freezing_threshold' : [] | [bigint],
  'wasm_memory_threshold' : [] | [bigint],
  'environment_variables' : [] | [Array<[string, string]>],
  'reserved_cycles_limit' : [] | [bigint],
  'wasm_memory_limit' : [] | [bigint],
  'memory_allocation' : [] | [bigint],
  'compute_allocation' : [] | [bigint],
}
export interface CanisterStatusResult {
  'memory_metrics' : MemoryMetrics,
  'status' : CanisterStatusType,
  'memory_size' : bigint,
  'ready_for_migration' : boolean,
  'version' : bigint,
  'cycles' : bigint,
  'settings' : DefiniteCanisterSettings,
  'query_stats' : QueryStats,
  'idle_cycles_burned_per_day' : bigint,
  'module_hash' : [] | [Uint8Array | number[]],
  'reserved_cycles' : bigint,
}
export type CanisterStatusType = { 'stopped' : null } |
  { 'stopping' : null } |
  { 'running' : null };
export interface ChunkDef { 'count' : bigint, 'start' : bigint }
export interface Config {
  'deployment_allowance_expiration_timeout' : bigint,
  'deployment_cycles_cost' : bigint,
  'max_deployments_per_chunk' : bigint,
  'cycles_converting_strategy' : CyclesConvertingStrategy,
  'deployment_fallback_account_hex' : string,
  'short_description_max_length' : bigint,
  'contract_url_pattern' : string,
  'contract_wasm_max_size' : bigint,
  'max_contract_templates_per_chunk' : bigint,
  'deployment_expenses_amount_buffer_permyriad' : bigint,
  'max_hub_events_per_chunk' : bigint,
  'is_deployment_available' : boolean,
  'deployment_expenses_amount_decimal_places' : number,
  'long_description_max_length' : bigint,
  'icp_xdr_conversion_rate_strategy' : IcpXdrConversionRateStrategy,
  'contract_canister_creation_strategy' : CreateContractCanisterStrategy,
  'name_max_length' : bigint,
  'contract_wasm_upload_chunk_size' : bigint,
  'regex_for_contract_principal_parsing' : Array<string>,
  'max_deployment_events_per_chunk' : bigint,
}
export interface ContractCertificate {
  'deployer' : Principal,
  'contract_canister' : Principal,
  'hub_canister' : Principal,
  'contract_wasm_hash' : string,
  'expiration' : bigint,
  'contract_template_id' : bigint,
}
export type ContractReference = { 'Url' : string } |
  { 'Canister' : Principal };
export interface ContractTemplateDefinition {
  'long_description' : [] | [string],
  'documentation_url' : string,
  'name' : string,
  'short_description' : string,
  'source_tag' : string,
  'source_url' : string,
  'certificate_duration' : bigint,
  'activation_required' : boolean,
  'terms_of_use_url' : string,
  'contract_canister_settings' : CanisterSettings,
  'wasm_hash' : string,
}
export interface ContractTemplateInformation {
  'blocked' : [] | [Timestamped],
  'deployments_count' : bigint,
  'registrar' : Principal,
  'definition' : ContractTemplateDefinition,
  'contract_template_id' : bigint,
  'registered' : bigint,
}
export interface ContractTemplatesFilter {
  'blocked' : [] | [boolean],
  'filter' : [] | [string],
}
export type ContractTemplatesSortingKey = { 'DeploymentsCount' : null } |
  { 'ContractTemplateId' : null } |
  { 'Registered' : null };
export type CreateContractCanisterStrategy = {
    'OverManagementCanister' : null
  } |
  { 'OverCMC' : { 'cmc_canister' : Principal } };
export type CyclesConvertingStrategy = { 'Skip' : null } |
  { 'CMCTopUp' : { 'cmc_canister' : Principal } };
export interface DefiniteCanisterSettings {
  'freezing_threshold' : bigint,
  'wasm_memory_threshold' : bigint,
  'environment_variables' : Array<EnvironmentVariable>,
  'controllers' : Array<Principal>,
  'reserved_cycles_limit' : bigint,
  'log_visibility' : LogVisibility,
  'wasm_memory_limit' : bigint,
  'memory_allocation' : bigint,
  'compute_allocation' : bigint,
}
export interface DelayedTimestampMillis { 'time' : bigint, 'delay' : bigint }
export interface DeployContractArgs {
  'subnet_type' : [] | [string],
  'approved_account' : LedgerAccount,
  'contract_template_id' : bigint,
}
export type DeployContractError = {
    'GetIcpXdrConversionRateError' : { 'reason' : string }
  } |
  { 'InsufficientApprovedAccountAllowance' : null } |
  { 'ActiveDeploymentExists' : ProcessDeploymentResult } |
  { 'DeploymentUnavailable' : null } |
  { 'ContractTemplateNotFound' : null } |
  { 'GenerateActivationCodeError' : { 'reason' : string } } |
  { 'InsufficientApprovedAccountBalance' : null } |
  { 'InvalidApprovedAccount' : { 'reason' : string } } |
  { 'CallerNotAuthorized' : null } |
  { 'CalculateDeploymentExpensesError' : { 'reason' : string } } |
  { 'ContractTemplateBlocked' : null } |
  { 'LedgerUnavailable' : { 'reason' : string } } |
  { 'AllowanceExpiresTooEarly' : null };
export type DeployContractResponse = { 'Ok' : ProcessDeploymentResult } |
  { 'Err' : DeployContractError };
export type DeploymentEventsSortingKey = { 'EventId' : null };
export interface DeploymentExpenses {
  'deployment_cycles_cost' : bigint,
  'amount_decimal_places' : number,
  'icp_conversation_rate' : IcpConversationRate,
  'contract_initial_cycles' : bigint,
  'amount_buffer_permyriad' : bigint,
}
export type DeploymentFilter = {
    'ByDeploymentId' : GetContractActivationCodeArgs
  } |
  { 'ByContractCanisterUrl' : { 'canister_url' : string } } |
  { 'Active' : { 'deployer' : Principal } } |
  { 'ByContractCanisterId' : { 'canister_id' : Principal } };
export interface DeploymentInformation {
  'deployer' : Principal,
  'created' : bigint,
  'contract_canister' : [] | [Principal],
  'lock' : [] | [DelayedTimestampMillis],
  'processing_error' : [] | [Timestamped],
  'expenses_amount' : bigint,
  'state' : DeploymentState,
  'need_processing' : boolean,
  'deployment_expenses' : DeploymentExpenses,
  'subnet_type' : [] | [string],
  'deployment_id' : bigint,
  'approved_account' : LedgerAccount,
  'contract_template_id' : bigint,
}
export type DeploymentProcessingEvent = {
    'UseExternalServiceConverting' : { 'reason' : string }
  } |
  { 'ContractWasmUploaded' : null } |
  {
    'ContractWasmChunkUploaded' : {
      'chunk_index' : bigint,
      'chunk_hash' : Uint8Array | number[],
    }
  } |
  { 'ContractCertificateGenerated' : null } |
  {
    'ContractCanisterOverManagementCreated' : {
      'settings' : CanisterSettings,
      'canister' : Principal,
    }
  } |
  { 'StartCompleteDeployment' : null } |
  { 'DeploymentStarted' : null } |
  {
    'TopUpFundsToCMCTransferred' : {
      'block_index' : bigint,
      'transfer_amount' : bigint,
      'cmc_canister' : Principal,
    }
  } |
  { 'RetryGenerateContractCertificate' : null } |
  { 'TopUpCMCNotified' : { 'cycles' : bigint } } |
  {
    'ContractCanisterOverCMCCreated' : {
      'settings' : CanisterSettings,
      'canister' : Principal,
    }
  } |
  { 'ContractWasmInstalled' : null } |
  {
    'DeployerFundsOnTransitAccountTransferred' : {
      'block_index' : [] | [bigint],
      'transfer_amount' : bigint,
      'transit_balance' : bigint,
    }
  } |
  { 'UseManagementCanisterCreation' : { 'reason' : string } } |
  { 'ContractSelfControlledMade' : null } |
  {
    'TransitFundsToExternalServiceTransferred' : {
      'block_index' : [] | [bigint],
      'transfer_amount' : bigint,
    }
  } |
  {
    'ContractCertificateReceived' : {
      'certificate' : SignedContractCertificate,
    }
  } |
  { 'DeploymentCanceled' : { 'reason' : string } } |
  { 'ReUploadContractWasm' : { 'reason' : string } } |
  {
    'InstallContractWasmStarted' : {
      'upload_chunk_size' : bigint,
      'upload_chunk_count' : bigint,
    }
  };
export interface DeploymentProcessingIdentifiedEvent {
  'id' : bigint,
  'time' : bigint,
  'event' : DeploymentProcessingEvent,
}
export type DeploymentResult = { 'Success' : null } |
  { 'Cancelled' : { 'reason' : string } };
export type DeploymentState = {
    'UploadContractWasm' : {
      'upload_chunk_size' : bigint,
      'certificate' : SignedContractCertificate,
      'uploaded_chunk_hashes' : Array<Uint8Array | number[]>,
      'upload_chunk_count' : bigint,
    }
  } |
  { 'WaitingReceiveContractCertificate' : null } |
  { 'MakeContractSelfControlled' : null } |
  {
    'NotifyCMCTopUp' : { 'block_index' : bigint, 'cmc_canister' : Principal }
  } |
  { 'GenerateContractCertificate' : null } |
  {
    'InstallContractWasm' : {
      'certificate' : SignedContractCertificate,
      'uploaded_chunk_hashes' : Array<Uint8Array | number[]>,
    }
  } |
  { 'TransferTopUpFundsToCMC' : null } |
  { 'TransferDeployerFundsToTransitAccount' : null } |
  { 'CreateContractCanisterOverManagement' : null } |
  { 'StartDeployment' : null } |
  { 'CreateContractCanisterOverCMC' : null } |
  { 'StartInstallContractWasm' : ObtainContractCertificateResult } |
  {
    'FinalizeDeployment' : {
      'result' : DeploymentResult,
      'sub_state' : FinalizeDeploymentState,
    }
  };
export type DeploymentsSelector = { 'All' : null } |
  {
    'ByDeployer' : {
      'deployer' : Principal,
      'contract_template_id' : [] | [bigint],
    }
  } |
  { 'ByContractTemplate' : GetContractTemplateArgs };
export type DeploymentsSortingKey = { 'DeploymentId' : null };
export interface EnvironmentVariable { 'value' : string, 'name' : string }
export type FinalizeDeploymentState = { 'Finalized' : null } |
  { 'TransferTransitFundsToExternalService' : null } |
  { 'StartDeploymentFinalization' : null };
export type GetAccessRightsResponse = { 'Ok' : GetAccessRightsResult };
export interface GetAccessRightsResult { 'access_rights' : Array<AccessRight> }
export type GetCanisterMetricsError = { 'PermissionDenied' : null };
export type GetCanisterMetricsResponse = { 'Ok' : GetCanisterMetricsResult } |
  { 'Err' : GetCanisterMetricsError };
export interface GetCanisterMetricsResult { 'metrics' : CanisterMetrics }
export type GetCanisterStatusError = {
    'ManagementCallError' : { 'reason' : string }
  };
export type GetCanisterStatusResponse = { 'Ok' : GetCanisterStatusResult } |
  { 'Err' : GetCanisterStatusError };
export interface GetCanisterStatusResult {
  'canister_status_response' : CanisterStatusResult,
}
export type GetConfigResponse = { 'Ok' : GetConfigResult };
export interface GetConfigResult { 'config' : Config }
export interface GetContractActivationCodeArgs { 'deployment_id' : bigint }
export type GetContractActivationCodeError = {
    'ContractActivationNotRequired' : null
  } |
  { 'DeploymentNotFound' : null } |
  { 'PermissionDenied' : null };
export type GetContractActivationCodeResponse = {
    'Ok' : GetContractActivationCodeResult
  } |
  { 'Err' : GetContractActivationCodeError };
export interface GetContractActivationCodeResult { 'code' : string }
export interface GetContractTemplateArgs { 'contract_template_id' : bigint }
export type GetContractTemplateError = { 'ContractTemplateNotFound' : null };
export type GetContractTemplateResponse = { 'Ok' : GetContractTemplateResult } |
  { 'Err' : GetContractTemplateError };
export interface GetContractTemplateResult {
  'contract_template' : ContractTemplateInformation,
}
export interface GetContractTemplatesArgs {
  'sorting' : [] | [SortingDefinition],
  'filter' : [] | [ContractTemplatesFilter],
  'chunk_def' : ChunkDef,
}
export type GetContractTemplatesError = {
    'ChunkCountExceedsLimit' : { 'max_chunk_count' : bigint }
  } |
  { 'FilterTextTooLong' : null } |
  { 'FilterTextTooShort' : null };
export type GetContractTemplatesResponse = {
    'Ok' : GetContractTemplatesResult
  } |
  { 'Err' : GetContractTemplatesError };
export interface GetContractTemplatesResult {
  'contract_templates' : Array<ContractTemplateInformation>,
  'total_count' : bigint,
}
export interface GetDeploymentArgs { 'filter' : DeploymentFilter }
export type GetDeploymentError = { 'DeploymentNotFound' : null };
export interface GetDeploymentEventsArgs {
  'sorting' : [] | [SortingDefinition_1],
  'chunk_def' : ChunkDef,
  'deployment_id' : bigint,
}
export type GetDeploymentEventsError = {
    'ChunkCountExceedsLimit' : { 'max_chunk_count' : bigint }
  } |
  { 'DeploymentNotFound' : null };
export type GetDeploymentEventsResponse = { 'Ok' : GetDeploymentEventsResult } |
  { 'Err' : GetDeploymentEventsError };
export interface GetDeploymentEventsResult {
  'events' : Array<DeploymentProcessingIdentifiedEvent>,
  'total_count' : bigint,
}
export type GetDeploymentResponse = { 'Ok' : GetDeploymentResult } |
  { 'Err' : GetDeploymentError };
export interface GetDeploymentResult { 'deployment' : DeploymentInformation }
export interface GetDeploymentsArgs {
  'sorting' : [] | [SortingDefinition_2],
  'chunk_def' : ChunkDef,
  'selector' : DeploymentsSelector,
}
export type GetDeploymentsError = {
    'ChunkCountExceedsLimit' : { 'max_chunk_count' : bigint }
  };
export type GetDeploymentsResponse = { 'Ok' : GetDeploymentsResult } |
  { 'Err' : GetDeploymentsError };
export interface GetDeploymentsResult {
  'deployments' : Array<DeploymentInformation>,
  'total_count' : bigint,
}
export interface GetHubEventsArgs {
  'sorting' : [] | [SortingDefinition_3],
  'chunk_def' : ChunkDef,
}
export type GetHubEventsError = {
    'ChunkCountExceedsLimit' : { 'max_chunk_count' : bigint }
  };
export type GetHubEventsResponse = { 'Ok' : GetHubEventsResult } |
  { 'Err' : GetHubEventsError };
export interface GetHubEventsResult {
  'events' : Array<IdentifiedHubEvent>,
  'total_count' : bigint,
}
export interface HubEvent {
  'time' : bigint,
  'event' : HubEventType,
  'caller' : Principal,
}
export type HubEventType = { 'ConfigSet' : GetConfigResult } |
  { 'ContractTemplateBlocked' : GetContractTemplateArgs } |
  { 'AccessRightsSet' : GetAccessRightsResult } |
  { 'ContractTemplateAdded' : GetContractTemplateArgs };
export type HubEventsSortingKey = { 'EventId' : null };
export type IcpConversationRate = {
    'CMC' : { 'xdr_permyriad_per_icp' : bigint, 'timestamp_seconds' : bigint }
  } |
  { 'Fixed' : { 'xdr_permyriad_per_icp' : bigint } };
export type IcpXdrConversionRateStrategy = {
    'CMC' : { 'cmc_canister' : Principal }
  } |
  { 'Fixed' : { 'xdr_permyriad_per_icp' : bigint } };
export interface IdentifiedHubEvent { 'id' : bigint, 'event' : HubEvent }
export interface InitializeContractCertificateArgs {
  'certificate' : SignedContractCertificate,
  'deployment_id' : bigint,
}
export type InitializeContractCertificateError = {
    'InvalidCertificate' : { 'reason' : string }
  } |
  { 'DeploymentNotFound' : null } |
  { 'PermissionDenied' : null } |
  { 'DeploymentWrongState' : null } |
  { 'DeploymentLocked' : { 'lock' : DelayedTimestampMillis } };
export type InitializeContractCertificateResponse = {
    'Ok' : GetDeploymentResult
  } |
  { 'Err' : InitializeContractCertificateError };
export type LedgerAccount = {
    'Account' : {
      'owner' : Principal,
      'subaccount' : [] | [Uint8Array | number[]],
    }
  } |
  { 'AccountIdentifier' : { 'slice' : Uint8Array | number[] } };
export type LogVisibility = { 'controllers' : null } |
  { 'public' : null } |
  { 'allowed_viewers' : Array<Principal> };
export interface MemoryMetrics {
  'wasm_binary_size' : bigint,
  'wasm_chunk_store_size' : bigint,
  'canister_history_size' : bigint,
  'stable_memory_size' : bigint,
  'snapshots_size' : bigint,
  'wasm_memory_size' : bigint,
  'global_memory_size' : bigint,
  'custom_sections_size' : bigint,
}
export interface ObtainContractCertificateArgs { 'deployment_id' : bigint }
export type ObtainContractCertificateError = { 'DeploymentNotFound' : null } |
  { 'PermissionDenied' : null } |
  { 'CertificateNotFound' : null } |
  { 'BuildCertificateError' : { 'reason' : string } } |
  { 'DeploymentWrongState' : null };
export type ObtainContractCertificateResponse = {
    'Ok' : ObtainContractCertificateResult
  } |
  { 'Err' : ObtainContractCertificateError };
export interface ObtainContractCertificateResult {
  'certificate' : SignedContractCertificate,
}
export type Permission = { 'AddContractTemplate' : null } |
  { 'BlockContractTemplate' : null } |
  { 'SetAccessRights' : null } |
  { 'SetConfig' : null };
export interface ProcessDeploymentArgs { 'deployment_id' : bigint }
export type ProcessDeploymentError = { 'DeploymentNotFound' : null } |
  { 'PermissionDenied' : null };
export type ProcessDeploymentResponse = { 'Ok' : GetDeploymentResult } |
  { 'Err' : ProcessDeploymentError };
export interface ProcessDeploymentResult {
  'deployment' : DeploymentInformation,
}
export interface QueryStats {
  'response_payload_bytes_total' : bigint,
  'num_instructions_total' : bigint,
  'num_calls_total' : bigint,
  'request_payload_bytes_total' : bigint,
}
export interface SetAccessRightsArgs { 'access_rights' : Array<AccessRight> }
export type SetAccessRightsError = { 'PermissionDenied' : null } |
  { 'LoseControlDangerous' : null };
export type SetAccessRightsResponse = { 'Ok' : null } |
  { 'Err' : SetAccessRightsError };
export interface SetConfigArgs { 'config' : Config }
export type SetConfigError = { 'WrongConfig' : { 'reason' : string } } |
  { 'PermissionDenied' : null };
export type SetConfigResponse = { 'Ok' : null } |
  { 'Err' : SetConfigError };
export interface SetUploadWasmGrantArgs { 'grant' : [] | [UploadWasmGrant] }
export type SetUploadWasmGrantError = { 'PermissionDenied' : null } |
  { 'WasmLengthIsTooBig' : null };
export type SetUploadWasmGrantResponse = { 'Ok' : null } |
  { 'Err' : SetUploadWasmGrantError };
export interface SignedContractCertificate {
  'signature' : Uint8Array | number[],
  'contract_certificate' : ContractCertificate,
}
export interface SortingDefinition {
  'key' : ContractTemplatesSortingKey,
  'order' : SortingOrder,
}
export interface SortingDefinition_1 {
  'key' : DeploymentEventsSortingKey,
  'order' : SortingOrder,
}
export interface SortingDefinition_2 {
  'key' : DeploymentsSortingKey,
  'order' : SortingOrder,
}
export interface SortingDefinition_3 {
  'key' : HubEventsSortingKey,
  'order' : SortingOrder,
}
export type SortingOrder = { 'Descending' : null } |
  { 'Ascending' : null };
export interface Timestamped { 'value' : string, 'timestamp' : bigint }
export interface UploadWasmChunkArgs {
  'first' : boolean,
  'chunk' : Uint8Array | number[],
}
export type UploadWasmChunkError = { 'GrantNotFound' : null } |
  { 'WasmLengthOverflow' : null } |
  { 'PermissionDenied' : null };
export type UploadWasmChunkResponse = { 'Ok' : UploadWasmChunkResult } |
  { 'Err' : UploadWasmChunkError };
export interface UploadWasmChunkResult { 'uploaded_length' : bigint }
export interface UploadWasmGrant {
  'operator' : Principal,
  'wasm_length' : bigint,
}
export interface ValidateContractCertificateArgs {
  'contract_reference' : ContractReference,
}
export type ValidateContractCertificateError = {
    'CertificateWrong' : { 'reason' : string }
  } |
  { 'ContractInfoUnavailable' : null } |
  { 'InvalidContractReferenceUrl' : null } |
  { 'ValidateContractUrlUnavailable' : { 'reason' : string } } |
  { 'CertificateUnavailable' : null };
export type ValidateContractCertificateResponse = {
    'Ok' : ValidateContractCertificateResult
  } |
  { 'Err' : ValidateContractCertificateError };
export interface ValidateContractCertificateResult {
  'certificate' : SignedContractCertificate,
  'delay_to_expiration_millis' : [] | [bigint],
}
export interface _SERVICE {
  'add_contract_template' : ActorMethod<
    [AddContractTemplateArgs],
    AddContractTemplateResponse
  >,
  'block_contract_template' : ActorMethod<
    [BlockContractTemplateArgs],
    BlockContractTemplateResponse
  >,
  'cancel_deployment' : ActorMethod<
    [CancelDeploymentArgs],
    CancelDeploymentResponse
  >,
  'deploy_contract' : ActorMethod<[DeployContractArgs], DeployContractResponse>,
  'get_access_rights' : ActorMethod<[{}], GetAccessRightsResponse>,
  'get_canister_metrics' : ActorMethod<[{}], GetCanisterMetricsResponse>,
  'get_canister_status' : ActorMethod<[], GetCanisterStatusResponse>,
  'get_config' : ActorMethod<[{}], GetConfigResponse>,
  'get_contract_activation_code' : ActorMethod<
    [GetContractActivationCodeArgs],
    GetContractActivationCodeResponse
  >,
  'get_contract_template' : ActorMethod<
    [GetContractTemplateArgs],
    GetContractTemplateResponse
  >,
  'get_contract_templates' : ActorMethod<
    [GetContractTemplatesArgs],
    GetContractTemplatesResponse
  >,
  'get_deployment' : ActorMethod<[GetDeploymentArgs], GetDeploymentResponse>,
  'get_deployment_events' : ActorMethod<
    [GetDeploymentEventsArgs],
    GetDeploymentEventsResponse
  >,
  'get_deployments' : ActorMethod<[GetDeploymentsArgs], GetDeploymentsResponse>,
  'get_hub_events' : ActorMethod<[GetHubEventsArgs], GetHubEventsResponse>,
  'initialize_contract_certificate' : ActorMethod<
    [InitializeContractCertificateArgs],
    InitializeContractCertificateResponse
  >,
  'obtain_contract_certificate' : ActorMethod<
    [ObtainContractCertificateArgs],
    ObtainContractCertificateResponse
  >,
  'process_deployment' : ActorMethod<
    [ProcessDeploymentArgs],
    ProcessDeploymentResponse
  >,
  'retry_generate_contract_certificate' : ActorMethod<
    [ProcessDeploymentArgs],
    CancelDeploymentResponse
  >,
  'set_access_rights' : ActorMethod<
    [SetAccessRightsArgs],
    SetAccessRightsResponse
  >,
  'set_config' : ActorMethod<[SetConfigArgs], SetConfigResponse>,
  'set_upload_wasm_grant' : ActorMethod<
    [SetUploadWasmGrantArgs],
    SetUploadWasmGrantResponse
  >,
  'upload_wasm_chunk' : ActorMethod<
    [UploadWasmChunkArgs],
    UploadWasmChunkResponse
  >,
  'validate_contract_certificate' : ActorMethod<
    [ValidateContractCertificateArgs],
    ValidateContractCertificateResponse
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
