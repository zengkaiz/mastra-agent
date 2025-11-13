# Worker 后端代码说明

## 文件结构

- `index.ts` - Cloudflare Worker 入口文件，处理 HTTP 请求路由
- `graphql-server.ts` - GraphQL Server 实现
- `schema.ts` - GraphQL Schema 定义（使用 GraphQL.js）
- `schema.graphql` - GraphQL Schema 的文本定义（参考）
- `resolvers.ts` - GraphQL Resolvers 实现
- `agent.ts` - Mastra Agent 配置和创建
- `types.ts` - TypeScript 类型定义

## 使用说明

### 开发

```bash
npm install
npm run dev
```

### 部署

```bash
npm run deploy
```

### 环境变量

需要在 Cloudflare Dashboard 或使用 wrangler 设置：

```bash
wrangler secret put OPENAI_API_KEY
```

## API 端点

- `POST /graphql` - GraphQL API 端点
- `GET /graphql` - GraphiQL 界面（开发环境）
- `GET /health` - 健康检查端点

## GraphQL Schema

```graphql
type Query {
  chat(message: String!): ChatResponse!
}

type Mutation {
  uploadPDF(file: Upload!): UploadResult!
}
```
