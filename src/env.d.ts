/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly VITE_CMF_API_KEY?: string;
    readonly VITE_CMF_API_SECRET?: string;
    readonly VITE_CMF_API_BASE_URL?: string;
  }
}

interface ImportMetaEnv {
  readonly VITE_CMF_API_KEY?: string;
  readonly VITE_CMF_API_SECRET?: string;
  readonly VITE_CMF_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
