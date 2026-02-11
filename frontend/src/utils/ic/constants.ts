import {Principal} from '@dfinity/principal';

export const INTERNET_IDENTITY_URL = import.meta.env.VITE_APP_INTERNET_IDENTITY_URL || 'https://id.ai';

export const LOCAL_REPLICA_API_PORT = 8080;
export const LOCAL_REPLICA_API_HOST = `http://localhost:${LOCAL_REPLICA_API_PORT}`;

export const MAINNET_LEDGER_CANISTER_ID_TEXT = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
export const MAINNET_LEDGER_CANISTER_ID: Principal = Principal.fromText(MAINNET_LEDGER_CANISTER_ID_TEXT);
