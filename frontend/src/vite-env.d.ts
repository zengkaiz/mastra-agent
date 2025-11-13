/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_ENDPOINT: string
  // 更多环境变量类型定义...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
