export const idlFactory = ({ IDL }) => {
  const CanisterSettings = IDL.Record({
    'initial_cycles' : IDL.Nat,
    'freezing_threshold' : IDL.Opt(IDL.Nat),
    'wasm_memory_threshold' : IDL.Opt(IDL.Nat),
    'environment_variables' : IDL.Opt(IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))),
    'reserved_cycles_limit' : IDL.Opt(IDL.Nat),
    'wasm_memory_limit' : IDL.Opt(IDL.Nat),
    'memory_allocation' : IDL.Opt(IDL.Nat),
    'compute_allocation' : IDL.Opt(IDL.Nat),
  });
  const ContractTemplateDefinition = IDL.Record({
    'long_description' : IDL.Opt(IDL.Text),
    'documentation_url' : IDL.Text,
    'name' : IDL.Text,
    'short_description' : IDL.Text,
    'source_tag' : IDL.Text,
    'source_url' : IDL.Text,
    'certificate_duration' : IDL.Nat64,
    'activation_required' : IDL.Bool,
    'terms_of_use_url' : IDL.Text,
    'contract_canister_settings' : CanisterSettings,
    'wasm_hash' : IDL.Text,
  });
  const AddContractTemplateArgs = IDL.Record({
    'contract_template_definition' : ContractTemplateDefinition,
  });
  const AddContractTemplateResult = IDL.Record({
    'contract_template_id' : IDL.Nat64,
  });
  const AddContractTemplateError = IDL.Variant({
    'GrantNotFound' : IDL.Null,
    'ContractLongDescriptionIsTooLong' : IDL.Record({
      'max_length' : IDL.Nat64,
    }),
    'ContractShortDescriptionIsTooLong' : IDL.Record({
      'max_length' : IDL.Nat64,
    }),
    'ContractNameIsTooLong' : IDL.Record({ 'max_length' : IDL.Nat64 }),
    'PermissionDenied' : IDL.Null,
    'ContractTemplateNameAlreadyExists' : IDL.Null,
    'InvalidWasmLength' : IDL.Record({ 'uploaded_length' : IDL.Nat64 }),
    'ContractTemplateWasmAlreadyExists' : IDL.Null,
    'InvalidWasmHash' : IDL.Record({ 'hash' : IDL.Text }),
  });
  const AddContractTemplateResponse = IDL.Variant({
    'Ok' : AddContractTemplateResult,
    'Err' : AddContractTemplateError,
  });
  const BlockContractTemplateArgs = IDL.Record({
    'contract_template_id' : IDL.Nat64,
    'reason' : IDL.Text,
  });
  const BlockContractTemplateError = IDL.Variant({
    'ContractTemplateNotFound' : IDL.Null,
    'PermissionDenied' : IDL.Null,
    'ContractTemplateAlreadyBlocked' : IDL.Null,
  });
  const BlockContractTemplateResponse = IDL.Variant({
    'Ok' : IDL.Null,
    'Err' : BlockContractTemplateError,
  });
  const CancelDeploymentArgs = IDL.Record({
    'deployment_id' : IDL.Nat64,
    'reason' : IDL.Text,
  });
  const DelayedTimestampMillis = IDL.Record({
    'time' : IDL.Nat64,
    'delay' : IDL.Nat64,
  });
  const Timestamped = IDL.Record({
    'value' : IDL.Text,
    'timestamp' : IDL.Nat64,
  });
  const ContractCertificate = IDL.Record({
    'deployer' : IDL.Principal,
    'contract_canister' : IDL.Principal,
    'hub_canister' : IDL.Principal,
    'contract_wasm_hash' : IDL.Text,
    'expiration' : IDL.Nat64,
    'contract_template_id' : IDL.Nat64,
  });
  const SignedContractCertificate = IDL.Record({
    'signature' : IDL.Vec(IDL.Nat8),
    'contract_certificate' : ContractCertificate,
  });
  const ObtainContractCertificateResult = IDL.Record({
    'certificate' : SignedContractCertificate,
  });
  const DeploymentResult = IDL.Variant({
    'Success' : IDL.Null,
    'Cancelled' : IDL.Record({ 'reason' : IDL.Text }),
  });
  const FinalizeDeploymentState = IDL.Variant({
    'Finalized' : IDL.Null,
    'TransferTransitFundsToExternalService' : IDL.Null,
    'StartDeploymentFinalization' : IDL.Null,
  });
  const DeploymentState = IDL.Variant({
    'UploadContractWasm' : IDL.Record({
      'upload_chunk_size' : IDL.Nat64,
      'certificate' : SignedContractCertificate,
      'uploaded_chunk_hashes' : IDL.Vec(IDL.Vec(IDL.Nat8)),
      'upload_chunk_count' : IDL.Nat64,
    }),
    'WaitingReceiveContractCertificate' : IDL.Null,
    'MakeContractSelfControlled' : IDL.Null,
    'NotifyCMCTopUp' : IDL.Record({
      'block_index' : IDL.Nat64,
      'cmc_canister' : IDL.Principal,
    }),
    'GenerateContractCertificate' : IDL.Null,
    'InstallContractWasm' : IDL.Record({
      'certificate' : SignedContractCertificate,
      'uploaded_chunk_hashes' : IDL.Vec(IDL.Vec(IDL.Nat8)),
    }),
    'TransferTopUpFundsToCMC' : IDL.Null,
    'TransferDeployerFundsToTransitAccount' : IDL.Null,
    'CreateContractCanisterOverManagement' : IDL.Null,
    'StartDeployment' : IDL.Null,
    'CreateContractCanisterOverCMC' : IDL.Null,
    'StartInstallContractWasm' : ObtainContractCertificateResult,
    'FinalizeDeployment' : IDL.Record({
      'result' : DeploymentResult,
      'sub_state' : FinalizeDeploymentState,
    }),
  });
  const IcpConversationRate = IDL.Variant({
    'CMC' : IDL.Record({
      'xdr_permyriad_per_icp' : IDL.Nat64,
      'timestamp_seconds' : IDL.Nat64,
    }),
    'Fixed' : IDL.Record({ 'xdr_permyriad_per_icp' : IDL.Nat64 }),
  });
  const DeploymentExpenses = IDL.Record({
    'deployment_cycles_cost' : IDL.Nat,
    'amount_decimal_places' : IDL.Nat8,
    'icp_conversation_rate' : IcpConversationRate,
    'contract_initial_cycles' : IDL.Nat,
    'amount_buffer_permyriad' : IDL.Nat64,
  });
  const LedgerAccount = IDL.Variant({
    'Account' : IDL.Record({
      'owner' : IDL.Principal,
      'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    }),
    'AccountIdentifier' : IDL.Record({ 'slice' : IDL.Vec(IDL.Nat8) }),
  });
  const DeploymentInformation = IDL.Record({
    'deployer' : IDL.Principal,
    'created' : IDL.Nat64,
    'contract_canister' : IDL.Opt(IDL.Principal),
    'lock' : IDL.Opt(DelayedTimestampMillis),
    'processing_error' : IDL.Opt(Timestamped),
    'expenses_amount' : IDL.Nat64,
    'state' : DeploymentState,
    'need_processing' : IDL.Bool,
    'deployment_expenses' : DeploymentExpenses,
    'subnet_type' : IDL.Opt(IDL.Text),
    'deployment_id' : IDL.Nat64,
    'approved_account' : LedgerAccount,
    'contract_template_id' : IDL.Nat64,
  });
  const GetDeploymentResult = IDL.Record({
    'deployment' : DeploymentInformation,
  });
  const CancelDeploymentError = IDL.Variant({
    'DeploymentNotFound' : IDL.Null,
    'PermissionDenied' : IDL.Null,
    'DeploymentWrongState' : IDL.Null,
    'DeploymentLocked' : IDL.Record({ 'lock' : DelayedTimestampMillis }),
  });
  const CancelDeploymentResponse = IDL.Variant({
    'Ok' : GetDeploymentResult,
    'Err' : CancelDeploymentError,
  });
  const DeployContractArgs = IDL.Record({
    'subnet_type' : IDL.Opt(IDL.Text),
    'approved_account' : LedgerAccount,
    'contract_template_id' : IDL.Nat64,
  });
  const ProcessDeploymentResult = IDL.Record({
    'deployment' : DeploymentInformation,
  });
  const DeployContractError = IDL.Variant({
    'GetIcpXdrConversionRateError' : IDL.Record({ 'reason' : IDL.Text }),
    'InsufficientApprovedAccountAllowance' : IDL.Null,
    'ActiveDeploymentExists' : ProcessDeploymentResult,
    'DeploymentUnavailable' : IDL.Null,
    'ContractTemplateNotFound' : IDL.Null,
    'GenerateActivationCodeError' : IDL.Record({ 'reason' : IDL.Text }),
    'InsufficientApprovedAccountBalance' : IDL.Null,
    'InvalidApprovedAccount' : IDL.Record({ 'reason' : IDL.Text }),
    'CallerNotAuthorized' : IDL.Null,
    'CalculateDeploymentExpensesError' : IDL.Record({ 'reason' : IDL.Text }),
    'ContractTemplateBlocked' : IDL.Null,
    'LedgerUnavailable' : IDL.Record({ 'reason' : IDL.Text }),
    'AllowanceExpiresTooEarly' : IDL.Null,
  });
  const DeployContractResponse = IDL.Variant({
    'Ok' : ProcessDeploymentResult,
    'Err' : DeployContractError,
  });
  const Permission = IDL.Variant({
    'AddContractTemplate' : IDL.Null,
    'BlockContractTemplate' : IDL.Null,
    'SetAccessRights' : IDL.Null,
    'SetConfig' : IDL.Null,
  });
  const AccessRight = IDL.Record({
    'permissions' : IDL.Opt(IDL.Vec(Permission)),
    'description' : IDL.Opt(IDL.Text),
    'caller' : IDL.Principal,
  });
  const GetAccessRightsResult = IDL.Record({
    'access_rights' : IDL.Vec(AccessRight),
  });
  const GetAccessRightsResponse = IDL.Variant({ 'Ok' : GetAccessRightsResult });
  const CanisterMetrics = IDL.Record({
    'stable_memory_size' : IDL.Nat64,
    'cycles' : IDL.Nat,
    'heap_memory_size' : IDL.Nat64,
  });
  const GetCanisterMetricsResult = IDL.Record({ 'metrics' : CanisterMetrics });
  const GetCanisterMetricsError = IDL.Variant({
    'PermissionDenied' : IDL.Null,
  });
  const GetCanisterMetricsResponse = IDL.Variant({
    'Ok' : GetCanisterMetricsResult,
    'Err' : GetCanisterMetricsError,
  });
  const MemoryMetrics = IDL.Record({
    'wasm_binary_size' : IDL.Nat,
    'wasm_chunk_store_size' : IDL.Nat,
    'canister_history_size' : IDL.Nat,
    'stable_memory_size' : IDL.Nat,
    'snapshots_size' : IDL.Nat,
    'wasm_memory_size' : IDL.Nat,
    'global_memory_size' : IDL.Nat,
    'custom_sections_size' : IDL.Nat,
  });
  const CanisterStatusType = IDL.Variant({
    'stopped' : IDL.Null,
    'stopping' : IDL.Null,
    'running' : IDL.Null,
  });
  const EnvironmentVariable = IDL.Record({
    'value' : IDL.Text,
    'name' : IDL.Text,
  });
  const LogVisibility = IDL.Variant({
    'controllers' : IDL.Null,
    'public' : IDL.Null,
    'allowed_viewers' : IDL.Vec(IDL.Principal),
  });
  const DefiniteCanisterSettings = IDL.Record({
    'freezing_threshold' : IDL.Nat,
    'wasm_memory_threshold' : IDL.Nat,
    'environment_variables' : IDL.Vec(EnvironmentVariable),
    'controllers' : IDL.Vec(IDL.Principal),
    'reserved_cycles_limit' : IDL.Nat,
    'log_visibility' : LogVisibility,
    'wasm_memory_limit' : IDL.Nat,
    'memory_allocation' : IDL.Nat,
    'compute_allocation' : IDL.Nat,
  });
  const QueryStats = IDL.Record({
    'response_payload_bytes_total' : IDL.Nat,
    'num_instructions_total' : IDL.Nat,
    'num_calls_total' : IDL.Nat,
    'request_payload_bytes_total' : IDL.Nat,
  });
  const CanisterStatusResult = IDL.Record({
    'memory_metrics' : MemoryMetrics,
    'status' : CanisterStatusType,
    'memory_size' : IDL.Nat,
    'ready_for_migration' : IDL.Bool,
    'version' : IDL.Nat64,
    'cycles' : IDL.Nat,
    'settings' : DefiniteCanisterSettings,
    'query_stats' : QueryStats,
    'idle_cycles_burned_per_day' : IDL.Nat,
    'module_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'reserved_cycles' : IDL.Nat,
  });
  const GetCanisterStatusResult = IDL.Record({
    'canister_status_response' : CanisterStatusResult,
  });
  const GetCanisterStatusError = IDL.Variant({
    'ManagementCallError' : IDL.Record({ 'reason' : IDL.Text }),
  });
  const GetCanisterStatusResponse = IDL.Variant({
    'Ok' : GetCanisterStatusResult,
    'Err' : GetCanisterStatusError,
  });
  const CyclesConvertingStrategy = IDL.Variant({
    'Skip' : IDL.Null,
    'CMCTopUp' : IDL.Record({ 'cmc_canister' : IDL.Principal }),
  });
  const IcpXdrConversionRateStrategy = IDL.Variant({
    'CMC' : IDL.Record({ 'cmc_canister' : IDL.Principal }),
    'Fixed' : IDL.Record({ 'xdr_permyriad_per_icp' : IDL.Nat64 }),
  });
  const CreateContractCanisterStrategy = IDL.Variant({
    'OverManagementCanister' : IDL.Null,
    'OverCMC' : IDL.Record({ 'cmc_canister' : IDL.Principal }),
  });
  const Config = IDL.Record({
    'deployment_allowance_expiration_timeout' : IDL.Nat64,
    'deployment_cycles_cost' : IDL.Nat,
    'max_deployments_per_chunk' : IDL.Nat64,
    'cycles_converting_strategy' : CyclesConvertingStrategy,
    'deployment_fallback_account_hex' : IDL.Text,
    'short_description_max_length' : IDL.Nat64,
    'contract_url_pattern' : IDL.Text,
    'contract_wasm_max_size' : IDL.Nat64,
    'max_contract_templates_per_chunk' : IDL.Nat64,
    'deployment_expenses_amount_buffer_permyriad' : IDL.Nat64,
    'max_hub_events_per_chunk' : IDL.Nat64,
    'is_deployment_available' : IDL.Bool,
    'deployment_expenses_amount_decimal_places' : IDL.Nat8,
    'long_description_max_length' : IDL.Nat64,
    'icp_xdr_conversion_rate_strategy' : IcpXdrConversionRateStrategy,
    'contract_canister_creation_strategy' : CreateContractCanisterStrategy,
    'name_max_length' : IDL.Nat64,
    'contract_wasm_upload_chunk_size' : IDL.Nat64,
    'regex_for_contract_principal_parsing' : IDL.Vec(IDL.Text),
    'max_deployment_events_per_chunk' : IDL.Nat64,
  });
  const GetConfigResult = IDL.Record({ 'config' : Config });
  const GetConfigResponse = IDL.Variant({ 'Ok' : GetConfigResult });
  const GetContractActivationCodeArgs = IDL.Record({
    'deployment_id' : IDL.Nat64,
  });
  const GetContractActivationCodeResult = IDL.Record({ 'code' : IDL.Text });
  const GetContractActivationCodeError = IDL.Variant({
    'ContractActivationNotRequired' : IDL.Null,
    'DeploymentNotFound' : IDL.Null,
    'PermissionDenied' : IDL.Null,
  });
  const GetContractActivationCodeResponse = IDL.Variant({
    'Ok' : GetContractActivationCodeResult,
    'Err' : GetContractActivationCodeError,
  });
  const GetContractTemplateArgs = IDL.Record({
    'contract_template_id' : IDL.Nat64,
  });
  const ContractTemplateInformation = IDL.Record({
    'blocked' : IDL.Opt(Timestamped),
    'deployments_count' : IDL.Nat64,
    'registrar' : IDL.Principal,
    'definition' : ContractTemplateDefinition,
    'contract_template_id' : IDL.Nat64,
    'registered' : IDL.Nat64,
  });
  const GetContractTemplateResult = IDL.Record({
    'contract_template' : ContractTemplateInformation,
  });
  const GetContractTemplateError = IDL.Variant({
    'ContractTemplateNotFound' : IDL.Null,
  });
  const GetContractTemplateResponse = IDL.Variant({
    'Ok' : GetContractTemplateResult,
    'Err' : GetContractTemplateError,
  });
  const ContractTemplatesSortingKey = IDL.Variant({
    'DeploymentsCount' : IDL.Null,
    'ContractTemplateId' : IDL.Null,
    'Registered' : IDL.Null,
  });
  const SortingOrder = IDL.Variant({
    'Descending' : IDL.Null,
    'Ascending' : IDL.Null,
  });
  const SortingDefinition = IDL.Record({
    'key' : ContractTemplatesSortingKey,
    'order' : SortingOrder,
  });
  const ContractTemplatesFilter = IDL.Record({
    'blocked' : IDL.Opt(IDL.Bool),
    'filter' : IDL.Opt(IDL.Text),
  });
  const ChunkDef = IDL.Record({ 'count' : IDL.Nat64, 'start' : IDL.Nat64 });
  const GetContractTemplatesArgs = IDL.Record({
    'sorting' : IDL.Opt(SortingDefinition),
    'filter' : IDL.Opt(ContractTemplatesFilter),
    'chunk_def' : ChunkDef,
  });
  const GetContractTemplatesResult = IDL.Record({
    'contract_templates' : IDL.Vec(ContractTemplateInformation),
    'total_count' : IDL.Nat64,
  });
  const GetContractTemplatesError = IDL.Variant({
    'ChunkCountExceedsLimit' : IDL.Record({ 'max_chunk_count' : IDL.Nat64 }),
    'FilterTextTooLong' : IDL.Null,
    'FilterTextTooShort' : IDL.Null,
  });
  const GetContractTemplatesResponse = IDL.Variant({
    'Ok' : GetContractTemplatesResult,
    'Err' : GetContractTemplatesError,
  });
  const DeploymentFilter = IDL.Variant({
    'ByDeploymentId' : GetContractActivationCodeArgs,
    'ByContractCanisterUrl' : IDL.Record({ 'canister_url' : IDL.Text }),
    'Active' : IDL.Record({ 'deployer' : IDL.Principal }),
    'ByContractCanisterId' : IDL.Record({ 'canister_id' : IDL.Principal }),
  });
  const GetDeploymentArgs = IDL.Record({ 'filter' : DeploymentFilter });
  const GetDeploymentError = IDL.Variant({ 'DeploymentNotFound' : IDL.Null });
  const GetDeploymentResponse = IDL.Variant({
    'Ok' : GetDeploymentResult,
    'Err' : GetDeploymentError,
  });
  const DeploymentEventsSortingKey = IDL.Variant({ 'EventId' : IDL.Null });
  const SortingDefinition_1 = IDL.Record({
    'key' : DeploymentEventsSortingKey,
    'order' : SortingOrder,
  });
  const GetDeploymentEventsArgs = IDL.Record({
    'sorting' : IDL.Opt(SortingDefinition_1),
    'chunk_def' : ChunkDef,
    'deployment_id' : IDL.Nat64,
  });
  const DeploymentProcessingEvent = IDL.Variant({
    'UseExternalServiceConverting' : IDL.Record({ 'reason' : IDL.Text }),
    'ContractWasmUploaded' : IDL.Null,
    'ContractWasmChunkUploaded' : IDL.Record({
      'chunk_index' : IDL.Nat64,
      'chunk_hash' : IDL.Vec(IDL.Nat8),
    }),
    'ContractCertificateGenerated' : IDL.Null,
    'ContractCanisterOverManagementCreated' : IDL.Record({
      'settings' : CanisterSettings,
      'canister' : IDL.Principal,
    }),
    'StartCompleteDeployment' : IDL.Null,
    'DeploymentStarted' : IDL.Null,
    'TopUpFundsToCMCTransferred' : IDL.Record({
      'block_index' : IDL.Nat64,
      'transfer_amount' : IDL.Nat64,
      'cmc_canister' : IDL.Principal,
    }),
    'RetryGenerateContractCertificate' : IDL.Null,
    'TopUpCMCNotified' : IDL.Record({ 'cycles' : IDL.Nat }),
    'ContractCanisterOverCMCCreated' : IDL.Record({
      'settings' : CanisterSettings,
      'canister' : IDL.Principal,
    }),
    'ContractWasmInstalled' : IDL.Null,
    'DeployerFundsOnTransitAccountTransferred' : IDL.Record({
      'block_index' : IDL.Opt(IDL.Nat64),
      'transfer_amount' : IDL.Nat64,
      'transit_balance' : IDL.Nat64,
    }),
    'UseManagementCanisterCreation' : IDL.Record({ 'reason' : IDL.Text }),
    'ContractSelfControlledMade' : IDL.Null,
    'TransitFundsToExternalServiceTransferred' : IDL.Record({
      'block_index' : IDL.Opt(IDL.Nat64),
      'transfer_amount' : IDL.Nat64,
    }),
    'ContractCertificateReceived' : IDL.Record({
      'certificate' : SignedContractCertificate,
    }),
    'DeploymentCanceled' : IDL.Record({ 'reason' : IDL.Text }),
    'ReUploadContractWasm' : IDL.Record({ 'reason' : IDL.Text }),
    'InstallContractWasmStarted' : IDL.Record({
      'upload_chunk_size' : IDL.Nat64,
      'upload_chunk_count' : IDL.Nat64,
    }),
  });
  const DeploymentProcessingIdentifiedEvent = IDL.Record({
    'id' : IDL.Nat64,
    'time' : IDL.Nat64,
    'event' : DeploymentProcessingEvent,
  });
  const GetDeploymentEventsResult = IDL.Record({
    'events' : IDL.Vec(DeploymentProcessingIdentifiedEvent),
    'total_count' : IDL.Nat64,
  });
  const GetDeploymentEventsError = IDL.Variant({
    'ChunkCountExceedsLimit' : IDL.Record({ 'max_chunk_count' : IDL.Nat64 }),
    'DeploymentNotFound' : IDL.Null,
  });
  const GetDeploymentEventsResponse = IDL.Variant({
    'Ok' : GetDeploymentEventsResult,
    'Err' : GetDeploymentEventsError,
  });
  const DeploymentsSortingKey = IDL.Variant({ 'DeploymentId' : IDL.Null });
  const SortingDefinition_2 = IDL.Record({
    'key' : DeploymentsSortingKey,
    'order' : SortingOrder,
  });
  const DeploymentsSelector = IDL.Variant({
    'All' : IDL.Null,
    'ByDeployer' : IDL.Record({
      'deployer' : IDL.Principal,
      'contract_template_id' : IDL.Opt(IDL.Nat64),
    }),
    'ByContractTemplate' : GetContractTemplateArgs,
  });
  const GetDeploymentsArgs = IDL.Record({
    'sorting' : IDL.Opt(SortingDefinition_2),
    'chunk_def' : ChunkDef,
    'selector' : DeploymentsSelector,
  });
  const GetDeploymentsResult = IDL.Record({
    'deployments' : IDL.Vec(DeploymentInformation),
    'total_count' : IDL.Nat64,
  });
  const GetDeploymentsError = IDL.Variant({
    'ChunkCountExceedsLimit' : IDL.Record({ 'max_chunk_count' : IDL.Nat64 }),
  });
  const GetDeploymentsResponse = IDL.Variant({
    'Ok' : GetDeploymentsResult,
    'Err' : GetDeploymentsError,
  });
  const HubEventsSortingKey = IDL.Variant({ 'EventId' : IDL.Null });
  const SortingDefinition_3 = IDL.Record({
    'key' : HubEventsSortingKey,
    'order' : SortingOrder,
  });
  const GetHubEventsArgs = IDL.Record({
    'sorting' : IDL.Opt(SortingDefinition_3),
    'chunk_def' : ChunkDef,
  });
  const HubEventType = IDL.Variant({
    'ConfigSet' : GetConfigResult,
    'ContractTemplateBlocked' : GetContractTemplateArgs,
    'AccessRightsSet' : GetAccessRightsResult,
    'ContractTemplateAdded' : GetContractTemplateArgs,
  });
  const HubEvent = IDL.Record({
    'time' : IDL.Nat64,
    'event' : HubEventType,
    'caller' : IDL.Principal,
  });
  const IdentifiedHubEvent = IDL.Record({
    'id' : IDL.Nat64,
    'event' : HubEvent,
  });
  const GetHubEventsResult = IDL.Record({
    'events' : IDL.Vec(IdentifiedHubEvent),
    'total_count' : IDL.Nat64,
  });
  const GetHubEventsError = IDL.Variant({
    'ChunkCountExceedsLimit' : IDL.Record({ 'max_chunk_count' : IDL.Nat64 }),
  });
  const GetHubEventsResponse = IDL.Variant({
    'Ok' : GetHubEventsResult,
    'Err' : GetHubEventsError,
  });
  const InitializeContractCertificateArgs = IDL.Record({
    'certificate' : SignedContractCertificate,
    'deployment_id' : IDL.Nat64,
  });
  const InitializeContractCertificateError = IDL.Variant({
    'InvalidCertificate' : IDL.Record({ 'reason' : IDL.Text }),
    'DeploymentNotFound' : IDL.Null,
    'PermissionDenied' : IDL.Null,
    'DeploymentWrongState' : IDL.Null,
    'DeploymentLocked' : IDL.Record({ 'lock' : DelayedTimestampMillis }),
  });
  const InitializeContractCertificateResponse = IDL.Variant({
    'Ok' : GetDeploymentResult,
    'Err' : InitializeContractCertificateError,
  });
  const ObtainContractCertificateArgs = IDL.Record({
    'deployment_id' : IDL.Nat64,
  });
  const ObtainContractCertificateError = IDL.Variant({
    'DeploymentNotFound' : IDL.Null,
    'PermissionDenied' : IDL.Null,
    'CertificateNotFound' : IDL.Null,
    'BuildCertificateError' : IDL.Record({ 'reason' : IDL.Text }),
    'DeploymentWrongState' : IDL.Null,
  });
  const ObtainContractCertificateResponse = IDL.Variant({
    'Ok' : ObtainContractCertificateResult,
    'Err' : ObtainContractCertificateError,
  });
  const ProcessDeploymentArgs = IDL.Record({ 'deployment_id' : IDL.Nat64 });
  const ProcessDeploymentError = IDL.Variant({
    'DeploymentNotFound' : IDL.Null,
    'PermissionDenied' : IDL.Null,
  });
  const ProcessDeploymentResponse = IDL.Variant({
    'Ok' : GetDeploymentResult,
    'Err' : ProcessDeploymentError,
  });
  const SetAccessRightsArgs = IDL.Record({
    'access_rights' : IDL.Vec(AccessRight),
  });
  const SetAccessRightsError = IDL.Variant({
    'PermissionDenied' : IDL.Null,
    'LoseControlDangerous' : IDL.Null,
  });
  const SetAccessRightsResponse = IDL.Variant({
    'Ok' : IDL.Null,
    'Err' : SetAccessRightsError,
  });
  const SetConfigArgs = IDL.Record({ 'config' : Config });
  const SetConfigError = IDL.Variant({
    'WrongConfig' : IDL.Record({ 'reason' : IDL.Text }),
    'PermissionDenied' : IDL.Null,
  });
  const SetConfigResponse = IDL.Variant({
    'Ok' : IDL.Null,
    'Err' : SetConfigError,
  });
  const UploadWasmGrant = IDL.Record({
    'operator' : IDL.Principal,
    'wasm_length' : IDL.Nat64,
  });
  const SetUploadWasmGrantArgs = IDL.Record({
    'grant' : IDL.Opt(UploadWasmGrant),
  });
  const SetUploadWasmGrantError = IDL.Variant({
    'PermissionDenied' : IDL.Null,
    'WasmLengthIsTooBig' : IDL.Null,
  });
  const SetUploadWasmGrantResponse = IDL.Variant({
    'Ok' : IDL.Null,
    'Err' : SetUploadWasmGrantError,
  });
  const UploadWasmChunkArgs = IDL.Record({
    'first' : IDL.Bool,
    'chunk' : IDL.Vec(IDL.Nat8),
  });
  const UploadWasmChunkResult = IDL.Record({ 'uploaded_length' : IDL.Nat64 });
  const UploadWasmChunkError = IDL.Variant({
    'GrantNotFound' : IDL.Null,
    'WasmLengthOverflow' : IDL.Null,
    'PermissionDenied' : IDL.Null,
  });
  const UploadWasmChunkResponse = IDL.Variant({
    'Ok' : UploadWasmChunkResult,
    'Err' : UploadWasmChunkError,
  });
  const ContractReference = IDL.Variant({
    'Url' : IDL.Text,
    'Canister' : IDL.Principal,
  });
  const ValidateContractCertificateArgs = IDL.Record({
    'contract_reference' : ContractReference,
  });
  const ValidateContractCertificateResult = IDL.Record({
    'certificate' : SignedContractCertificate,
    'delay_to_expiration_millis' : IDL.Opt(IDL.Nat64),
  });
  const ValidateContractCertificateError = IDL.Variant({
    'CertificateWrong' : IDL.Record({ 'reason' : IDL.Text }),
    'ContractInfoUnavailable' : IDL.Null,
    'InvalidContractReferenceUrl' : IDL.Null,
    'ValidateContractUrlUnavailable' : IDL.Record({ 'reason' : IDL.Text }),
    'CertificateUnavailable' : IDL.Null,
  });
  const ValidateContractCertificateResponse = IDL.Variant({
    'Ok' : ValidateContractCertificateResult,
    'Err' : ValidateContractCertificateError,
  });
  return IDL.Service({
    'add_contract_template' : IDL.Func(
        [AddContractTemplateArgs],
        [AddContractTemplateResponse],
        [],
      ),
    'block_contract_template' : IDL.Func(
        [BlockContractTemplateArgs],
        [BlockContractTemplateResponse],
        [],
      ),
    'cancel_deployment' : IDL.Func(
        [CancelDeploymentArgs],
        [CancelDeploymentResponse],
        [],
      ),
    'deploy_contract' : IDL.Func(
        [DeployContractArgs],
        [DeployContractResponse],
        [],
      ),
    'get_access_rights' : IDL.Func(
        [IDL.Record({})],
        [GetAccessRightsResponse],
        ['query'],
      ),
    'get_canister_metrics' : IDL.Func(
        [IDL.Record({})],
        [GetCanisterMetricsResponse],
        ['query'],
      ),
    'get_canister_status' : IDL.Func([], [GetCanisterStatusResponse], []),
    'get_config' : IDL.Func([IDL.Record({})], [GetConfigResponse], ['query']),
    'get_contract_activation_code' : IDL.Func(
        [GetContractActivationCodeArgs],
        [GetContractActivationCodeResponse],
        ['query'],
      ),
    'get_contract_template' : IDL.Func(
        [GetContractTemplateArgs],
        [GetContractTemplateResponse],
        ['query'],
      ),
    'get_contract_templates' : IDL.Func(
        [GetContractTemplatesArgs],
        [GetContractTemplatesResponse],
        ['query'],
      ),
    'get_deployment' : IDL.Func(
        [GetDeploymentArgs],
        [GetDeploymentResponse],
        ['query'],
      ),
    'get_deployment_events' : IDL.Func(
        [GetDeploymentEventsArgs],
        [GetDeploymentEventsResponse],
        ['query'],
      ),
    'get_deployments' : IDL.Func(
        [GetDeploymentsArgs],
        [GetDeploymentsResponse],
        ['query'],
      ),
    'get_hub_events' : IDL.Func(
        [GetHubEventsArgs],
        [GetHubEventsResponse],
        ['query'],
      ),
    'initialize_contract_certificate' : IDL.Func(
        [InitializeContractCertificateArgs],
        [InitializeContractCertificateResponse],
        [],
      ),
    'obtain_contract_certificate' : IDL.Func(
        [ObtainContractCertificateArgs],
        [ObtainContractCertificateResponse],
        ['query'],
      ),
    'process_deployment' : IDL.Func(
        [ProcessDeploymentArgs],
        [ProcessDeploymentResponse],
        [],
      ),
    'retry_generate_contract_certificate' : IDL.Func(
        [ProcessDeploymentArgs],
        [CancelDeploymentResponse],
        [],
      ),
    'set_access_rights' : IDL.Func(
        [SetAccessRightsArgs],
        [SetAccessRightsResponse],
        [],
      ),
    'set_config' : IDL.Func([SetConfigArgs], [SetConfigResponse], []),
    'set_upload_wasm_grant' : IDL.Func(
        [SetUploadWasmGrantArgs],
        [SetUploadWasmGrantResponse],
        [],
      ),
    'upload_wasm_chunk' : IDL.Func(
        [UploadWasmChunkArgs],
        [UploadWasmChunkResponse],
        [],
      ),
    'validate_contract_certificate' : IDL.Func(
        [ValidateContractCertificateArgs],
        [ValidateContractCertificateResponse],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
