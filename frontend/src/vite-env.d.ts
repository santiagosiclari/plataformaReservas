/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    // podés agregar más variables acá si las usás
    // readonly VITE_OTHER_KEY: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }