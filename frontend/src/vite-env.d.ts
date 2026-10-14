/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_CURRENCY?: string;
  readonly VITE_APP_TIMEZONE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
