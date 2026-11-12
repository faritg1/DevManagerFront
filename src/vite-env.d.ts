/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** "true" turns on the demo mode (docs/demo.md); anything else leaves the app unchanged. */
  readonly VITE_DEMO_MODE?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}