/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Enable the development-only mock wallet (backed by a real Testnet account). */
  readonly VITE_MOCK_WALLET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
