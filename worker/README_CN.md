# Worker 后端项目说明

## ✅ 已更新：使用 Mastra 框架

本项目现在使用 **Mastra AI Agent 框架** 构建后端。

## 技术栈

- **Mastra Core** (`@mastra/core`) - AI Agent 框架
- **AI SDK OpenAI** (`@ai-sdk/openai`) - OpenAI 模型集成
- **GraphQL Helix** - GraphQL Server
- **Cloudflare Workers** - 无服务器运行时
- **Cloudflare Vectorize** - 向量数据库

## 项目结构

```
worker/
├── src/
│   ├── index.ts           # Worker 入口，CORS 配置
│   ├── agent.ts           # Mastra Agent 配置 ✨
│   ├── knowledge-tool.ts  # 知识库检索工具 ✨
│   ├── graphql-server.ts  # GraphQL Server
│   ├── schema.ts          # GraphQL Schema
│   ├── resolvers.ts       # GraphQL Resolvers
│   ├── vectorize.ts       # Vectorize 集成
│   ├── pdf-processor.ts   # PDF 处理
│   └── types.ts           # TypeScript 类型
├── package.json
├── wrangler.toml         # Cloudflare Worker 配置
├── QUICKSTART.md         # 快速启动指南
└── TROUBLESHOOTING.md    # 故障排查

✨ = 使用 Mastra 框架
```

## 核心功能

### 1. Mastra Agent（`agent.ts`）

使用 Mastra 框架创建面试辅导 Agent：

```typescript
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';

const agent = new Agent({
  name: 'interview-assistant',
  instructions: '...',
  model: openai('gpt-4o-mini', {
    apiKey: env.OPENAI_API_KEY,
  }),
  tools: {
    searchKnowledgeBase: knowledgeBaseTool,
  },
});
```

### 2. 知识库工具（`knowledge-tool.ts`）

使用 Mastra 的 `createTool` API：

```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const tool = createTool({
  id: 'search_knowledge_base',
  description: '...',
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ input }) => {
    // 实现检索逻辑
  },
});
```

### 3. GraphQL API

提供以下接口：

- `query chat(message: String!): ChatResponse!` - 聊天接口
- `mutation uploadPDF(file: Upload!): UploadResult!` - PDF 上传

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 设置环境变量
export OPENAI_API_KEY="sk-xxxx"

# 3. 创建 Vectorize 索引
wrangler vectorize create frontend-assistant --dimensions=1536 --metric=cosine

# 4. 启动开发服务器
npm run dev
```

访问 `http://localhost:8787/graphql` 测试 API。

## 依赖说明

| 包名                  | 版本    | 说明                     |
| --------------------- | ------- | ------------------------ |
| `@mastra/core`        | ^0.1.50 | Mastra AI Agent 框架核心 |
| `@ai-sdk/openai`      | ^1.0.0  | OpenAI 模型提供者        |
| `ai`                  | ^3.0.0  | AI SDK 核心库            |
| `zod`                 | ^3.22.4 | Schema 验证（Tool 参数） |
| `@graphql-helix/core` | ^1.7.2  | GraphQL Server           |
| `graphql`             | ^16.8.1 | GraphQL 核心             |

## 环境变量

| 变量名            | 说明             | 设置方式                         |
| ----------------- | ---------------- | -------------------------------- |
| `OPENAI_API_KEY`  | OpenAI API 密钥  | `wrangler secret put` 或环境变量 |
| `VECTORIZE_INDEX` | Vectorize 索引名 | `wrangler.toml` 配置             |

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 类型检查
npm run typecheck

# 部署到生产环境
npm run deploy
```

## API 示例

### Chat 查询

```graphql
query {
  chat(message: "What is React hooks?") {
    reply
  }
}
```

### PDF 上传

```graphql
mutation {
  uploadPDF(file: $file) {
    success
    message
  }
}
```

## Mastra Agent 工作流程

1. 用户发送消息到 GraphQL API
2. `chatResolver` 创建 Mastra Agent
3. Agent 调用 `generate()` 方法
4. Agent 自动使用知识库工具检索相关信息
5. OpenAI 模型生成英文回答
6. 返回结果给前端

## 故障排查

如果遇到问题，请查看：

- [QUICKSTART.md](./QUICKSTART.md) - 启动指南
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 常见问题

或运行：

```bash
wrangler tail  # 查看实时日志
```

## 资源链接

- [Mastra 文档](https://mastra.ai/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Vectorize 文档](https://developers.cloudflare.com/vectorize/)
