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

## 旧版架构概览

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

## 新版架构概览（优化版）

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Cloudflare Platform                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌───────────────────┐         ┌────────────────────────────────────────┐   │
│  │ Cloudflare Pages  │         │       Cloudflare Workers               │   │
│  │   (Frontend)      │         │         (Backend API)                  │   │
│  │                   │         │                                        │   │
│  │  React + Vite     │ GraphQL │  ┌──────────────────────────────────┐ │   │
│  │  urql Client      │────────>│  │  GraphQL Server                  │ │   │
│  └───────────────────┘         │  │  (graphql-yoga)                  │ │   │
│         │                      │  └──────────────────────────────────┘ │   │
│         │ PDF Upload           │              │                         │   │
│         │                      │              ↓                         │   │
│         ↓                      │  ┌──────────────────────────────────┐ │   │
│  ┌───────────────┐             │  │  Mastra Agent                    │ │   │
│  │   R2 Bucket   │<────────────│  │  - gpt-4o-mini                   │ │   │
│  │  (PDF 存储)    │     直接上传 │  │  - searchKnowledgeBase tool     │ │   │
│  └───────────────┘             │  └──────────────────────────────────┘ │   │
│         │                      │              │                         │   │
│         │ PDF 已上传            │              │ 调用工具                │   │
│         ↓                      │              ↓                         │   │
│  ┌────────────────────────┐   │  ┌──────────────────────────────────┐ │   │
│  │  Durable Object        │<──│  │  Knowledge Base Tool             │ │   │
│  │  (PDF Processor)       │   │  │  - 生成 query embedding          │ │   │
│  │                        │   │  │  - 查询 Vectorize                │ │   │
│  │  异步处理流程：         │   │  │  - 返回相关文档                  │ │   │
│  │  1. 从 R2 获取 PDF     │   │  └──────────────────────────────────┘ │   │
│  │  2. 提取文本(unpdf)    │   │              │    ↑                    │   │
│  │  3. 文本分块           │   │              │    │                    │   │
│  │  4. 批量生成 embeddings│   │              ↓    │ 查询                │   │
│  │  5. 存储到 Vectorize   │   │  ┌──────────────────────────────────┐ │   │
│  └────────────────────────┘   │  │   Cloudflare AI Workers          │ │   │
│         │                      │  │   @cf/baai/bge-small-en-v1.5     │ │   │
│         │ embeddings           │  │   (384 维向量)                   │ │   │
│         ↓                      │  └──────────────────────────────────┘ │   │
│  ┌───────────────┐             │              │                         │   │
│  │  Vectorize    │<────────────┼──────────────┘                         │   │
│  │  (向量数据库)  │             │  批量 upsert                            │   │
│  │  - 384 维      │             │  (每批 10 个向量)                       │   │
│  │  - cosine 距离 │             │                                        │   │
│  └───────────────┘             └────────────────────────────────────────┘   │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 架构优化要点

#### 1. **PDF 处理优化**
- ✅ **Durable Objects**：突破 Worker CPU 时间限制（10ms → 无限制）
- ✅ **批量处理**：每批处理 10 个 chunks，减少 subrequests（原 246 → 88）
- ✅ **更大 chunk size**：1000 字符/chunk（原 500），减少总 chunks 数量
- ✅ **R2 存储**：PDF 先存储到 R2，避免内存溢出

#### 2. **向量化优化**
- ✅ **Cloudflare AI Workers**：使用本地 AI 模型（BGE-small-en-v1.5）
- ✅ **无需 OpenAI Embeddings**：降低成本和延迟
- ✅ **384 维向量**：更小的存储空间，更快的查询速度
- ✅ **并行生成**：批量并行生成 embeddings

#### 3. **RAG 工具集成**
- ✅ **Mastra Tool System**：标准化工具接口
- ✅ **自动工具调用**：Agent 自动决定何时调用知识库
- ✅ **结构化输出**：使用 `outputSchema` 确保返回格式正确

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
  --dimensions=384 \
  --metric=cosine
```

**注意**：使用 384 维向量（Cloudflare AI BGE-small-en-v1.5 模型）

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
- **Cloudflare Durable Objects** - 异步 PDF 处理
- **GraphQL Yoga** - GraphQL Server
- **Cloudflare Vectorize** - 向量数据库
- **Cloudflare AI Workers** - Embeddings 生成（BGE-small-en-v1.5）
- **Cloudflare R2** - PDF 文件存储
- **OpenAI** - LLM（gpt-4o-mini）
- **unpdf** - PDF 文本提取

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

## 📖 RAG 流程详解

### 一、PDF 上传与向量化流程

```
┌────────────┐
│ 1. 用户上传 │
│    PDF     │
└──────┬─────┘
       │
       ↓
┌────────────────────────────────────────────────────────┐
│ 2. Frontend → Worker (/upload-pdf)                     │
│    - 验证文件类型（.pdf）                               │
│    - 验证文件大小（< 10MB）                             │
│    - 上传到 R2 Bucket                                  │
└──────┬──────────────────────────────────────────────────┘
       │
       ↓
┌────────────────────────────────────────────────────────┐
│ 3. Worker → Durable Object (异步)                      │
│    POST http://internal/process                        │
│    {                                                   │
│      r2Key: "pdfs/xxx.pdf",                           │
│      filename: "resume.pdf",                          │
│      uploadedAt: "2025-11-14T..."                     │
│    }                                                   │
└──────┬──────────────────────────────────────────────────┘
       │
       ↓
┌────────────────────────────────────────────────────────┐
│ 4. Durable Object 处理 PDF                             │
│                                                        │
│    Step 1: 从 R2 下载 PDF                              │
│    ┌─────────────────────────────────┐               │
│    │ const r2Obj = await             │               │
│    │   env.PDF_BUCKET.get(r2Key)     │               │
│    └─────────────────────────────────┘               │
│                                                        │
│    Step 2: 提取文本                                    │
│    ┌─────────────────────────────────┐               │
│    │ unpdf 库提取 PDF 文本            │               │
│    │ 回退：正则提取 BT...ET 块        │               │
│    │ 过滤：元数据、日期、哈希值        │               │
│    └─────────────────────────────────┘               │
│          ↓                                             │
│    📝 Extracted: 1,290 characters                     │
│                                                        │
│    Step 3: 文本分块                                    │
│    ┌─────────────────────────────────┐               │
│    │ chunkSize: 1000 字符             │               │
│    │ overlap: 200 字符                │               │
│    │ 结果：约 2-3 chunks              │               │
│    └─────────────────────────────────┘               │
│                                                        │
│    Step 4: 批量向量化（每批 10 个）                    │
│    ┌─────────────────────────────────┐               │
│    │ for batch in chunks:            │               │
│    │   // 并行生成 embeddings          │               │
│    │   embeddings = await            │               │
│    │     Promise.all(                │               │
│    │       batch.map(chunk =>        │               │
│    │         AI.run(                 │               │
│    │           '@cf/baai/bge-small-  │               │
│    │            en-v1.5',            │               │
│    │           { text: chunk }       │               │
│    │         )                       │               │
│    │       )                         │               │
│    │     )                           │               │
│    │                                 │               │
│    │   // 批量存储                    │               │
│    │   await VECTORIZE.upsert(       │               │
│    │     vectors                     │               │
│    │   )                             │               │
│    └─────────────────────────────────┘               │
└──────┬──────────────────────────────────────────────────┘
       │
       ↓
┌────────────────────────────────────────────────────────┐
│ 5. Vectorize 存储                                       │
│                                                        │
│    Vector 格式：                                        │
│    {                                                   │
│      id: "abc123-0",               // 短哈希-索引     │
│      values: [0.1, 0.2, ..., 0.3], // 384 维向量      │
│      metadata: {                                      │
│        filename: "resume.pdf",                        │
│        chunkIndex: 0,                                 │
│        uploadedAt: "2025-11-14...",                  │
│        text: "I'm a frontend engineer..."  // 原文本   │
│      }                                                │
│    }                                                   │
│                                                        │
│    ✅ 存储完成                                          │
└────────────────────────────────────────────────────────┘
```

### 二、聊天查询与 RAG 检索流程

```
┌────────────┐
│ 1. 用户提问 │
│ "你在哪家  │
│  公司工作？"│
└──────┬─────┘
       │
       ↓
┌────────────────────────────────────────────────────────┐
│ 2. Frontend → Worker (/graphql)                        │
│    mutation {                                          │
│      chat(message: "你在哪家公司工作？") {              │
│        reply                                           │
│      }                                                 │
│    }                                                   │
└──────┬──────────────────────────────────────────────────┘
       │
       ↓
┌────────────────────────────────────────────────────────┐
│ 3. Mastra Agent 处理                                    │
│                                                        │
│    Step 1: Agent 分析问题                               │
│    ┌─────────────────────────────────┐               │
│    │ System Prompt:                  │               │
│    │ "ALWAYS use searchKnowledgeBase │               │
│    │  tool first before answering"   │               │
│    │                                 │               │
│    │ Agent 决定：需要调用工具          │               │
│    └─────────────────────────────────┘               │
│          ↓                                             │
│    Step 2: 调用 searchKnowledgeBase 工具               │
│    ┌─────────────────────────────────┐               │
│    │ toolCall: {                     │               │
│    │   toolName: "searchKnowledgeBase│               │
│    │   args: {                       │               │
│    │     query: "previous companies" │  // 英文查询   │
│    │   }                             │               │
│    │ }                               │               │
│    └─────────────────────────────────┘               │
└──────┬──────────────────────────────────────────────────┘
       │
       ↓
┌────────────────────────────────────────────────────────┐
│ 4. Knowledge Base Tool 执行                            │
│                                                        │
│    Step 1: 生成查询向量                                 │
│    ┌─────────────────────────────────┐               │
│    │ const embedding = await         │               │
│    │   AI.run(                       │               │
│    │     '@cf/baai/bge-small-en-v1.5'│               │
│    │     { text: "previous companies"│               │
│    │   )                             │               │
│    │                                 │               │
│    │ 结果：[0.15, 0.23, ..., 0.42]   │  // 384 维     │
│    └─────────────────────────────────┘               │
│          ↓                                             │
│    Step 2: 查询 Vectorize                             │
│    ┌─────────────────────────────────┐               │
│    │ const results = await           │               │
│    │   VECTORIZE.query(              │               │
│    │     queryEmbedding,             │               │
│    │     { topK: 5,                  │  // 返回 5 个  │
│    │       returnMetadata: true }    │               │
│    │   )                             │               │
│    └─────────────────────────────────┘               │
│          ↓                                             │
│    Step 3: 格式化结果                                  │
│    ┌─────────────────────────────────┐               │
│    │ 返回格式：                       │               │
│    │ "Found 3 relevant information: │               │
│    │                                 │               │
│    │ [1] I worked at TechCorp as a  │               │
│    │     Frontend Engineer...        │               │
│    │     Source: resume.pdf          │               │
│    │     Relevance: 47.7%            │               │
│    │                                 │               │
│    │ [2] My previous role involved  │               │
│    │     React development...        │               │
│    │     Source: resume.pdf          │               │
│    │     Relevance: 45.1%            │               │
│    │ ..."                            │               │
│    └─────────────────────────────────┘               │
└──────┬──────────────────────────────────────────────────┘
       │
       ↓
┌────────────────────────────────────────────────────────┐
│ 5. Agent 生成最终回答                                   │
│                                                        │
│    Input to LLM:                                       │
│    ┌─────────────────────────────────┐               │
│    │ System: You are an interview   │               │
│    │         candidate...            │               │
│    │                                 │               │
│    │ User: 你在哪家公司工作？          │               │
│    │                                 │               │
│    │ Tool Result:                    │               │
│    │ "Found 3 relevant information:  │               │
│    │  [1] I worked at TechCorp..."   │               │
│    └─────────────────────────────────┘               │
│          ↓                                             │
│    LLM 生成:                                           │
│    ┌─────────────────────────────────┐               │
│    │ "I previously worked at         │               │
│    │  TechCorp as a Frontend         │               │
│    │  Engineer, where I was          │               │
│    │  responsible for building       │               │
│    │  responsive web applications    │               │
│    │  using React and TypeScript..." │               │
│    └─────────────────────────────────┘               │
└──────┬──────────────────────────────────────────────────┘
       │
       ↓
┌────────────┐
│ 6. 返回前端 │
│  显示回答   │
└────────────┘
```

### 三、关键技术细节

#### 向量相似度计算

```typescript
// Cosine Similarity
similarity = dot(query_vector, doc_vector) /
             (norm(query_vector) * norm(doc_vector))

// 分数越高 = 越相关
// 0.5+ : 高相关性
// 0.3-0.5 : 中等相关性
// < 0.3 : 低相关性
```

#### Subrequest 优化

```
原方案（单个处理）：
  123 chunks × 2 (AI.run + upsert) = 246 subrequests ❌

优化方案（批量处理）：
  123 chunks ÷ 10 = 13 batches
  13 × (10 AI.run + 1 upsert) = 143 subrequests ✅

  更大 chunk (1000 chars):
  62 chunks ÷ 10 = 7 batches
  7 × 11 = 77 subrequests ✅✅
```

#### 错误处理与回退

```typescript
// PDF 提取回退链
1. unpdf 库 (最优)
   ↓ 失败
2. 正则提取 BT...ET 块
   ↓ 失败
3. 提取所有括号内文本 + 过滤元数据
   ↓ 失败
4. 返回错误，建议用户导出文本
```

## ✅ Prompt 优化记录

**问题**：之前的 prompt 过于严格，会拒绝回答一些个人生活相关的面试问题。

**优化**（2025-11-14）：

- 明确定义了面试范围，包括技术问题、个人背景、职业发展、行为问题、生活方式问题等
- AI 现在会正常回答以下类型的问题：
  - 姓名、年龄、婚姻状况等个人信息
  - 上家公司介绍、工作经历
  - 兴趣爱好、喜欢的运动
  - 日常寒暄和闲聊
- 只有完全不相关或不适当的问题才会被拒绝
