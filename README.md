# 💼 Mastra 面试辅导 Agent — MVP 项目

基于 Mastra + Cloudflare 的智能面试辅助系统，帮助前端工程师准备英文技术面试。

## ✨ 功能特点

- 🤖 **智能面试助手**：基于 Mastra Agent，自动生成英文面试回答
- 📚 **知识库支持**：上传简历和面试经验 PDF，个性化回答
- 💬 **实时聊天**：简洁的聊天界面，支持中英文输入
- 🎨 **现代 UI**：Warm tones 设计，响应式布局
- ⚡ **高性能**：Cloudflare Workers + Pages，全球低延迟

## 📁 项目结构

```
mastra-agent/
├── worker/              # Cloudflare Worker 后端
│   ├── src/
│   │   ├── index.ts     # Worker 入口
│   │   ├── graphql-server.ts  # GraphQL Server
│   │   ├── agent.ts      # Mastra Agent 配置
│   │   ├── resolvers.ts  # GraphQL Resolvers
│   │   ├── vectorize.ts # 向量化存储和检索
│   │   └── ...
│   ├── package.json
│   └── wrangler.toml
├── frontend/            # React 前端
│   ├── src/
│   │   ├── components/  # React 组件
│   │   ├── graphql/     # GraphQL 客户端
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
├── DEPLOYMENT.md       # 详细部署指南
└── mastra_interview_mvp_tech_plan.md
```

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐          ┌────────────────────────┐  │
│  │ Cloudflare Pages │          │  Cloudflare Workers    │  │
│  │   (Frontend)     │ ───────> │     (Backend API)      │  │
│  │                  │  GraphQL │                        │  │
│  │  React + Vite    │          │  Mastra + GraphQL      │  │
│  └──────────────────┘          └────────────────────────┘  │
│                                          │                   │
│                                          ↓                   │
│                                  ┌──────────────┐           │
│                                  │  Vectorize   │           │
│                                  │  (向量数据库)  │           │
│                                  └──────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 前置要求

- Node.js 18+ 或 Bun
- Cloudflare 账号
- OpenAI API Key

### 1. 克隆项目

```bash
git clone <repository-url>
cd mastra-agent
```

### 2. 安装依赖

**后端：**

```bash
cd worker
npm install
# 或
pnpm install
```

**前端：**

```bash
cd frontend
npm install
# 或
pnpm install
```

### 3. 配置环境变量

**Worker：**

```bash
cd worker
# 设置 OpenAI API Key
wrangler secret put OPENAI_API_KEY
```

**Frontend：**

```bash
cd frontend
# 创建 .env.local
echo "VITE_GRAPHQL_ENDPOINT=http://localhost:8787/graphql" > .env.local
```

### 4. 创建 Vectorize 索引

```bash
cd worker
wrangler vectorize create frontend-assistant \
  --dimensions=1536 \
  --metric=cosine
```

### 5. 启动开发服务器

**后端（Terminal 1）：**

```bash
cd worker
npm run dev
```

**前端（Terminal 2）：**

```bash
cd frontend
npm run dev
```

访问 `http://localhost:5173` 查看前端应用。

## 📦 部署

详细的部署说明请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)。

### 快速部署

**Worker：**

```bash
cd worker
wrangler deploy
```

**Pages：**

```bash
cd frontend
npm run build
wrangler pages deploy dist --project-name=mastra-interview-frontend
```

## 🔧 技术栈

### 后端

- **Mastra** - AI Agent 框架
- **Cloudflare Workers** - 无服务器运行时
- **GraphQL Helix** - GraphQL Server
- **Cloudflare Vectorize** - 向量数据库
- **OpenAI** - LLM 和 Embeddings

### 前端

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **urql** - GraphQL 客户端
- **Tailwind CSS** - 样式框架
- **Framer Motion** - 动画库
- **Vite** - 构建工具

## 📝 环境变量

### Worker

| 变量名            | 类型     | 说明               |
| ----------------- | -------- | ------------------ |
| `OPENAI_API_KEY`  | Secret   | OpenAI API 密钥    |
| `VECTORIZE_INDEX` | Variable | Vectorize 索引名称 |

### Frontend

| 变量名                  | 类型     | 说明                 |
| ----------------------- | -------- | -------------------- |
| `VITE_GRAPHQL_ENDPOINT` | Variable | GraphQL API 端点 URL |

## 🧪 开发

### 类型检查

```bash
# Worker
cd worker
npm run typecheck

# Frontend
cd frontend
npm run typecheck
```

### 构建

```bash
# Worker（无需构建，直接部署）
cd worker
wrangler deploy

# Frontend
cd frontend
npm run build
```

## 📚 文档

- [技术方案](./mastra_interview_mvp_tech_plan.md) - 详细的技术方案文档
- [部署指南](./DEPLOYMENT.md) - 完整的部署说明
- [Worker README](./worker/src/README.md) - 后端代码说明

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Mastra](https://mastra.ai/) - AI Agent 框架
- [Cloudflare](https://www.cloudflare.com/) - 基础设施支持
- [OpenAI](https://openai.com/) - AI 模型
