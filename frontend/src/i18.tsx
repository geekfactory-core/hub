import {wrapWithPrefix} from './utils/core/i18/prefix';

const rawI18 = {
    common: {
        button: {
            cancelButton: 'Cancel',
            retryButton: 'Retry'
        },
        error: {
            unableTo: 'Something went wrong.',
            keyValueFailedToLoad: 'Failed to load',
            insufficientBalance: 'This wallet has an insufficient balance.'
        },
        loading: 'Loading...'
    },
    auth: {
        connect: {
            confirmationModal: {
                title: 'Connect to Hub',
                description: 'Review and confirm the following before connecting.',
                agreementCheckbox: {
                    termsOfUse: {
                        part1: 'I have read and agree to the',
                        termsOfUse: 'Terms of Use'
                    },
                    faq: {
                        part1: 'I have read the ',
                        part2: 'official FAQ'
                    }
                },
                button: 'Connect with Internet Identity'
            },
            connectButton: 'Connect'
        },
        disconnect: {
            confirmationModal: {
                title: 'Disconnect',
                description: 'Do you want to disconnect?',
                button: 'Disconnect'
            },
            disconnectButton: 'Disconnect'
        }
    },
    toolbar: {
        title: 'GEEKFACTORY',
        menu: {
            home: 'Home',
            validateContract: 'Validate Contract',
            myDeployments: 'My Deployed Contracts',
            contractTemplates: 'Templates',
            status: 'Status',
            darkMode: 'Dark Mode',
            termsOfUse: 'Terms of Use',
            sourceCode: 'Source Code',
            faq: 'FAQ'
        }
    },
    breadcrumb: {
        contractTemplates: 'Templates',
        contractTemplate: 'Template',
        deployments: 'Contracts',
        deployment: 'Contract',
        events: 'Events',
        validateContract: 'Validate Contract',
        myDeployments: 'My Contracts',
        status: 'Status'
    },
    home: {
        title: 'Deploy and verify smart contracts on the Internet Computer.',
        description: 'Decentralized by architecture, secure by code, trustless by design.',
        validate: {
            title: 'Validate Existing Contract'
        },
        latestContractTemplates: {
            panelTitle: 'Latest Contract Templates',
            viewAllContractTemplates: 'View All Contract Templates'
        }
    },
    validateContract: {
        form: {
            panelTitle: 'Validate Contract',
            description: 'Enter contract URL to validate.',
            inputLabel: 'Contract URL',
            validateButton: 'Validate Contract',
            inputInvalidURL: 'URL is not valid'
        },
        stub: {
            error: 'This contract URL is not valid.'
        },
        certificateDetails: {
            panelTitle: 'Certificate Details',
            expirationDate: 'Certificate Expiration Date',
            expirationDateLabel: {
                label: (duration: string) => `${duration} left`,
                soon: 'less than a second left'
            },
            expirationDateExpiredWarning: 'Expired',
            contractCanisterId: 'Contract Canister ID',
            hubCanisterId: 'Hub Canister ID',
            deployedBy: 'Deployed by',
            contractWasmHash: 'Contract WASM Hash',
            contractTemplateId: 'Contract Template ID'
        }
    },
    contractTemplate: {
        stub: {
            loading: {
                description: 'Getting template details.'
            },
            error: 'Unable to load template.'
        },
        action: {
            deploy: {
                available: 'Deploy',
                blocked: 'Blocked',
                tooltip: {
                    deploymentUnavailable: 'Deployment is currently unavailable'
                }
            },
            details: 'View Details',
            deployments: (count: string) => `Contracts (${count})`
        },
        details: {
            panelDescription: 'Template Details',
            status: {
                title: 'Status',
                blocked: 'Blocked',
                active: 'Active',
                modal: {
                    blocked: {title: 'Reason'}
                }
            },
            certificateDuration: 'Certificate Duration',
            registered: 'Registered',
            registrar: 'Registrar',
            documentationUrl: 'Documentation',
            termsOfUseUrl: 'Terms of Use',
            source: 'Source',
            sourceUrl: 'URL',
            sourceTag: 'Tag',
            wasmHash: 'WASM Hash',
            activationRequired: 'Activation Required'
        },
        viewDeployments: 'Contracts',
        deployModal: {
            title: 'Deploy Contract',
            okText: 'Deploy',
            stub: {
                loading: 'Loading contract information...',
                blocked: 'Template blocked and no longer available.',
                deploymentNotAllowedOnTheBackend: 'Contract deployment currently not allowed.',
                activeDeploymentExists: 'Unable to deploy because your current deployment is still in progress.'
            },
            description: 'Launch your own contract from this template.',
            name: 'Name',
            transactionFee: 'Transaction Fee',
            price: 'You Will Spend',
            requiredCycles: 'Required Cycles',
            contractInitialAllocation: 'Contract Initial Allocation',
            deploymentCost: 'Deployment Cost',
            conversionRate: 'Rate per 1T Cycles'
        }
    },
    contractTemplates: {
        pageTitle: 'Contract Templates',
        stub: {
            loading: 'Loading templates...',
            empty: 'No templates',
            error: 'Unable to load templates.'
        },
        form: {
            filterPlaceholder: 'Name or description',
            searchButton: 'Search',
            resetButton: 'Reset',
            filter: {
                all: 'All',
                active: 'Active',
                blocked: 'Blocked'
            },
            sorting: {
                newest: 'Newest',
                oldest: 'Oldest',
                mostDeployed: 'Most Deployed',
                leastDeployed: 'Least Deployed'
            }
        }
    },
    deployment: {
        stub: {
            loading: {
                description: 'Getting contract details.'
            },
            error: 'Unable to load contract.'
        },
        contractStatus: {
            panelTitle: 'Contract Status',
            common: {
                loading: 'Loading...',
                notApplicable: 'n/a',
                waiting: '...',
                error: 'Error'
            },
            templateState: {
                title: 'Template',
                active: 'Active',
                blocked: 'Blocked'
            },
            contractState: {
                title: 'Contract',
                deploying: 'Deploying',
                deployed: 'Deployed',
                terminated: 'Terminated'
            },
            activationState: {
                title: 'Activation',
                notRequired: 'Not Required',
                activated: 'Completed',
                required: 'Required'
            },
            certificate: {
                title: 'Certificate',
                valid: 'Valid',
                expired: 'Expired',
                invalid: 'Invalid'
            },
            warning: {
                success: 'This contract is valid and ready to use.',
                templateState: {
                    contractTemplateBlocked: 'This contract can no longer be trusted for secure operations because its template was blocked!'
                },
                contractState: {
                    deploying: 'This contract is being deployed.',
                    terminated: 'This contract was terminated by the owner and is no longer available.'
                },
                activationState: {
                    activationRequired: 'This contract has not been activated.',
                    unableToLoad: 'Unable to load activation status.'
                },
                validationState: {
                    certificateExpired: 'This contract can no longer be trusted for secure operations because its certificate has expired!',
                    unableToValidate: 'Unable to validate certificate.',
                    certificateInvalid: 'This contract can no longer be trusted for secure operations because its certificate is invalid!',
                    unableToLoad: 'Unable to load certificate information.'
                }
            }
        },
        contractDeployment: {
            panelTitle: 'Contract Deployment',
            panelDescription: 'DO NOT CLOSE THIS PAGE UNTIL DEPLOYMENT IS COMPLETE!',
            progressSteps: {
                transferICP: 'Transferring ICP',
                mintingCycles: 'Minting cycles',
                createContractCanister: 'Creating contract canister',
                generateCertificate: 'Generating certificate',
                deployingContractCanister: 'Deploying contract canister',
                removingControllersFromContractCanister: 'Removing controllers from contract canister',
                finalizeDeployment: 'Finalizing deployment'
            },
            terminate: {
                terminateDeploymentButton: 'Terminate Deployment',
                modal: {
                    title: 'Terminate Deployment',
                    ok: 'Terminate',
                    text1: 'Do you want to terminate the deployment?',
                    text2: 'THIS ACTION CANNOT BE UNDONE.',
                    text3: 'PRICE PAID TOWARD THIS DEPLOYMENT WILL BE LOST.'
                }
            }
        },
        contractActivation: {
            panelTitle: 'Contract Activation',
            stub: {
                activationCode: 'Unable to load the activation code.'
            },
            instructionSteps: {
                copyActivationCode: 'Copy activation code',
                openContract: 'Open contract and connect with Internet Identity',
                finalizeActivation: 'Paste activation code and follow further instructions'
            }
        },
        deploymentDetails: {
            panelDescription: 'Deployment Details',
            contract: 'Contract Template',
            createdOn: 'Created On',
            contractCanisterId: 'Contract Canister ID',
            contractURL: 'Contract URL',
            deployedBy: 'Deployed By',
            contractOwner: {
                title: 'Contract Owner',
                notSet: 'Not set'
            }
        },
        viewAllEvents: 'View All Events',
        goToContract: 'Go to Contract'
    },
    deploymentEvents: {
        panelTitle: 'Contract Deployment Events',
        stub: {
            loading: 'Loading deployment events...',
            empty: 'No deployment events',
            error: 'Unable to load deployment events.'
        },
        table: {
            event: 'Event',
            created: 'Created'
        }
    },
    deployments: {
        pageTitle: 'Deployed Contracts',
        stub: {
            loading: 'Loading deployments...',
            empty: 'No deployments',
            error: 'Unable to load deployments.'
        },
        form: {
            onlyMyDeployments: {
                allContracts: 'All contracts',
                onlyMyContracts: 'Only my contracts'
            },
            sorting: {
                newest: 'Newest',
                oldest: 'Oldest'
            },
            textPlaceholder: 'Canister ID',
            searchButton: 'Search',
            resetButton: 'Reset'
        },
        table: {
            created: 'Created',
            canister: 'Canister',
            status: {
                columnTitle: 'Status',
                deploying: 'Deploying',
                deployed: 'Deployed',
                terminated: 'Terminated'
            }
        }
    },
    myDeployments: {
        pageTitle: 'My Deployed Contracts',
        stub: {
            loading: 'Loading contracts...',
            empty: 'No contracts',
            error: 'Unable to load contracts.'
        },
        form: {
            textPlaceholder: 'Canister ID',
            searchButton: 'Search',
            resetButton: 'Reset'
        },
        table: {
            created: 'Created',
            canister: 'Canister',
            stub: {
                noCanister: '-'
            },
            viewDetails: 'View Details'
        }
    },
    status: {
        canisterStatus: {
            backend: {
                panelTitle: 'Hub Canister Status'
            },
            frontend: {
                panelTitle: 'Hub Frontend Canister Status'
            },
            canisterId: 'Canister ID',
            cycles: 'Cycles',
            memory: 'Memory',
            idleCyclesBurnedPerDay: 'Idle Cycles Burned Per Day',
            reservedCycles: 'Reserved Cycles',
            requestPayloadTotal: 'Request Payload Total',
            responsePayloadTotal: 'Response Payload Total',
            numberOfCalls: 'Number of Calls Total',
            numberOfInstructions: 'Number of Instructions Total',
            logVisibility: {
                label: 'Log Visibility',
                public: 'Public',
                controllers: 'Controllers',
                allowedViewers: 'Allowed Viewers:'
            },
            controllers: 'Controllers',
            noControllers: 'No controllers',
            moduleHash: 'Module Hash',
            noModuleHash: 'No module hash',
            subnetId: 'Subnet'
        },
        hubConfiguration: {
            panelTitle: 'Hub Configuration',
            deploymentCyclesCost: 'Deployment Cost',
            deploymentCostBuffer: 'Deployment Cost Buffer',
            deploymentCostRounding: 'Deployment Cost Rounding',
            deploymentCostRoundingDigits: ' digits',
            deploymentAvailable: 'Deployment Available',
            deploymentAvailableYes: 'Yes',
            deploymentAvailableNo: 'No',
            cyclesConvertingStrategy: 'Cycles Converting Strategy',
            cyclesConvertingStrategySkipCMC: 'Skip CMC',
            cyclesConvertingStrategyUseCMC: 'Using CMC canister: ',
            createContractCanisterStrategy: 'Create Contract Canister Strategy',
            createContractCanisterStrategyOverManagementCanister: 'Over Management Canister',
            createContractCanisterStrategyUseCMC: 'Using CMC canister: ',
            icpXdrConversionRateStrategy: 'ICP XDR Conversion Rate Strategy',
            icpXdrConversionRateStrategyUseCMC: 'Using CMC canister: ',
            icpXdrConversionRateStrategyFixed: 'Using Fixed Rate per 1T Cycles: ',
            deploymentFallbackAccount: 'Deployment Fallback Account',
            hubEventChunkSize: 'Hub Event Chunk Size',
            templateChunkSize: 'Template Chunk Size',
            deploymentChunkSize: 'Deployment Chunk Size',
            deploymentEventChunkSize: 'Deployment Event Chunk Size',
            contractTemplateNameMaxLength: 'Contract Name Max Length',
            contractTemplateShortDescriptionMaxLength: 'Contract Short Description Max Length',
            contractTemplateLongDescriptionMaxLength: 'Contract Long Description Max Length'
        },
        abstractCanisterSettings: {
            defaultValue: 'Default',
            initialCycles: 'Initial Cycle Balance',
            freezingThreshold: {
                label: 'Freezing Threshold',
                valuePostfix: ' seconds'
            },
            reservedCyclesLimit: 'Reserved Cycles Limit',
            wasmMemoryLimit: 'WASM Memory Limit',
            wasmMemoryThreshold: 'WASM Memory Threshold',
            memoryAllocation: 'Memory Allocation',
            computeAllocation: 'Compute Allocation'
        },
        contractCanisterSettings: {
            panelTitle: 'Contract Canister Deployment Settings'
        },
        contractsSettings: {
            maxContractWASMFileSize: 'Max Contract WASM File Size',
            uploadWASMChunkSize: 'WASM Chunk Size',
            urlValidationRegex: 'URL Validation Regex',
            canisterURLPattern: 'Canister URL Pattern',
            allowanceExpiration: 'Allowance expiration'
        },
        accessRights: {
            panelTitle: 'Access Rights',
            stub: {
                loading: 'Loading access rights...',
                error: 'Unable to load access rights.',
                empty: 'No access rights'
            },
            principal: 'Principal',
            description: 'Description',
            permissions: 'Permissions'
        },
        hubEvents: {
            panelTitle: 'Hub Events',
            stub: {
                loading: 'Loading Hub events...',
                error: 'Unable to load Hub events.',
                empty: 'No Hub events'
            },
            table: {
                created: 'Created',
                event: 'Event',
                stub: {
                    unknownEvent: '-'
                }
            }
        },
        loggerEvents: {
            panelTitle: 'Hub Browser Events',
            panelDescription: 'A technical log of browser events, mainly intended for debugging or advanced troubleshooting.',
            stub: {
                loading: 'Loading browser events...',
                empty: 'No browser events',
                error: 'Unable to load browser events.'
            },
            table: {
                level: 'Level',
                message: 'Message',
                created: 'Created'
            }
        }
    }
};

export const i18 = wrapWithPrefix(rawI18);
