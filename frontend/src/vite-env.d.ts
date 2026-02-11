/// <reference types="vite/client" />

interface ViteTypeOptions {
    strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
    readonly VITE_APP_BACKEND_CANISTER_ID: string;
    readonly VITE_APP_FRONTEND_CANISTER_ID: string;
    readonly VITE_APP_INTERNET_IDENTITY_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
