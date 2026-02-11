import {MILLIS_PER_DAY} from './utils/core/date/constants';
import {IS_DEV_ENVIRONMENT} from './utils/env';
import {LOCAL_REPLICA_API_PORT} from './utils/ic/constants';

export const SESSION_TIME_TO_LIVE_MILLIS = BigInt(14 * MILLIS_PER_DAY);

export const DEPLOYMENT_ALLOWANCE_EXPIRATION_MULTIPLIER = 2n;

export const PAGE_SIZE = {
    DEFAULT: 10,
    contractTemplates: 10,
    latestContractTemplates: 3,
    contractDeployments: 20,
    deploymentEvents: 20,
    myDeployments: 20,
    hubEvents: 10,
    accessRights: 10,
    browserEvents: 10
};

export const DEFAULT_CONTRACT_URL_PATTERN = IS_DEV_ENVIRONMENT ? `http://{principal}.localhost:${LOCAL_REPLICA_API_PORT}` : `https://{principal}.icp0.io`;

export const BASE_EXTERNAL_REPOSITORY_PAGE_URL = `https://github.com/geekfactory-core/hub/blob/main/`;

export const MODAL_WIDTH = 700;

export const Canisters = {
    hub: `${import.meta.env.VITE_APP_BACKEND_CANISTER_ID}`,
    hubFrontend: `${import.meta.env.VITE_APP_FRONTEND_CANISTER_ID}`
};
