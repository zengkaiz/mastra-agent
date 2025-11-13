# 💼 Mastra 面试辅导 Agent — MVP 技术方案

**目标：**  
构建一个基于 **Mastra + Cloudflare** 的智能面试辅助系统，帮助前端工程师在英语面试中快速生成自然流畅的英文回答。

---

## 1️⃣ 产品目标与价值

| 维度     | 说明                                                     |
| -------- | -------------------------------------------------------- |
| 用户     | 前端工程师（准备或参与英文面试的人）                     |
| 目标     | 模拟真实面试问答场景，快速生成英文回答                   |
| 主要价值 | 帮助用户提前训练英语表达、复习简历重点、提升面试反应能力 |

---

## 2️⃣ MVP 范围（功能边界）

| 模块          | 功能                                               | MVP 目标                |
| ------------- | -------------------------------------------------- | ----------------------- |
| 🤖 Agent      | 输入面试问题（任意语言），输出英文回答             | ✅ 实现                 |
| 📚 知识库     | 支持上传个人简历 / 面试经验（PDF），作为参考上下文 | ✅ 实现基本上传与检索   |
| 💬 聊天 UI    | 简单输入框 + 回复区（无流式、无语音）              | ✅ 实现                 |
| ☁️ 部署       | 后端：Cloudflare Worker<br>前端：Cloudflare Pages  | ✅ 实现                 |
| 🧠 向量数据库 | 基于 Cloudflare Vectorize 存储 PDF 知识库          | ✅ 实现                 |
| 🔊 语音输入   | 实时语音识别（Whisper / Web Speech）               | 🚫 暂不实现（预留接口） |
| 🔗 通信协议   | **GraphQL** 替代 REST，前后端统一接口规范          | ✅ 实现                 |

---

## 3️⃣ 系统架构概览

```
+---------------------------------------------------------------+
|                       Cloudflare Pages (React + urql)         |
|  - Chat UI (React + TS)                                       |
|  - PDF upload page                                            |
|  - GraphQL 调用 /graphql 接口                                 |
+---------------------------------------------------------------+
                |                           ▲
                | HTTPS GraphQL             |
                ▼                           |
+---------------------------------------------------------------+
|             Cloudflare Worker + Mastra Core                   |
|  - GraphQL Server (graphql-yoga / Apollo)                            |
|  - Mastra Agent（prompt + 工具）                              |
|  - 知识库：PDF 解析 + 向量化检索（Cloudflare Vectorize）       |
|  - Resolver: chat, uploadPDF                                  |
+---------------------------------------------------------------+
                |
                ▼
+---------------------------------------------------------------+
|                 Cloudflare Vectorize (Vector DB)              |
|  - 向量索引（简历 + 知识库）                                 |
|  - 支持相似度检索                                             |
+---------------------------------------------------------------+
```

---

## 4️⃣ 技术选型

| 模块           | 技术 / 框架                      | 选择理由                                            |
| -------------- | -------------------------------- | --------------------------------------------------- |
| 后端核心       | **Mastra**                       | 提供 Agent、工具、Prompt、Workflow 等结构化 AI 框架 |
| GraphQL Server | **graphql-yoga**                 | 可运行在 Cloudflare Worker 环境中                   |
| 向量数据库     | **Cloudflare Vectorize**         | 与 Worker 同平台、低延迟、免费 10k 向量             |
| 文档解析       | Mastra 内置 PDF Loader           | 直接向量化 PDF 内容                                 |
| 前端框架       | **React + TypeScript + urql**    | 轻量高效 GraphQL 客户端                             |
| 前端部署       | **Cloudflare Pages**             | 免费、自动集成 CI/CD                                |
| 模型调用       | OpenAI GPT-4o-mini 或 Claude 3.5 | 英语生成质量优                                      |
| 状态管理       | React Query 或 Zustand           | 简化状态与请求管理                                  |

---

## 5️⃣ 模块设计说明

### 🤖 Agent 模块

- 基于 `Mastra.Agent` 定义一个 Interview Assistant
- 职责：
  - 接收 GraphQL 的输入问题（任意语言）
  - 统一转为英文回答
  - 自动结合知识库（简历 + 以往面试经验）

**Prompt 核心逻辑：**

```
You are an English-speaking assistant that helps a frontend engineer prepare for interviews.
You always respond in fluent English.
If the user asks a question in another language, translate it mentally but still answer in English.
Use the user’s resume and prior interview experience as context when applicable.
```

**调用流程：**

1. 前端通过 GraphQL 发送 `chat(message)`
2. Worker 调用 `interviewAgent.run({ input })`
3. Agent 内部自动执行：
   - 检索知识库（向量搜索）
   - 拼接上下文
   - 调用 LLM 生成英文回答
4. 返回回答文本

---

## 6️⃣ GraphQL Schema 与 API 设计

```graphql
type Query {
  chat(message: String!): ChatResponse!
}

type Mutation {
  uploadPDF(file: Upload!): UploadResult!
}

type ChatResponse {
  reply: String!
}

type UploadResult {
  success: Boolean!
  message: String
}
```

**前端调用示例：**

```graphql
query Chat($message: String!) {
  chat(message: $message) {
    reply
  }
}
```

---

## 7️⃣ UI 风格规范（🎨 重要更新）

**设计目标：**  
简洁、专业、无压感的面试辅导环境。

**颜色与样式：**
| 元素 | 指南 |
|------|-------|
| 主色调 | 避免使用 **蓝色**、**紫色**、**indigo** |
| 替代色系 | 使用灰、白、橙、绿色调（warm tones） |
| 背景 | `#F9F9F9` / `#FFFFFF` |
| 主要按钮 | `#F59E0B`（橙色）或 `#10B981`（绿色） |
| 字体 | Inter / Noto Sans |
| 动画 | Framer Motion，低干扰、平滑过渡 |
| 边框 | `#E5E7EB` 浅灰色，圆角 2xl |

**布局建议：**

- 使用 Grid 或 Flex 实现响应式布局
- 聊天区为浅灰底卡片样式
- 输入框独立悬浮于底部，保持简洁

---

## 8️⃣ 部署与环境配置

### Cloudflare Worker

```bash
wrangler deploy
```

**wrangler.toml**

```toml
[vars]
OPENAI_API_KEY = "sk-xxxx"
VECTORIZE_INDEX = "frontend-assistant"
```

### Cloudflare Vectorize

```bash
wrangler vectorize create frontend-assistant
```

### Cloudflare Pages

```bash
npm run build
```

输出目录：`dist/`

**环境变量：**

```
VITE_GRAPHQL_ENDPOINT=https://your-worker.zengkai.shop/graphql
```

---

## 9️⃣ 可行性与性能分析

| 项目     | 说明                                     |
| -------- | ---------------------------------------- |
| 延迟     | Worker 内执行 LLM 调用，通常 <2s         |
| 成本     | Cloudflare 平台免费层 + 模型调用按量计费 |
| 可扩展性 | 可平滑扩展多知识库 / 多语言支持          |
| 数据安全 | PDF 内容向量化后无原文暴露               |

---

## 🔟 未来迭代方向

| 方向            | 内容                              |
| --------------- | --------------------------------- |
| 🎤 实时语音输入 | 集成 Web Speech API 或 Whisper    |
| 🧩 多知识库支持 | 区分不同技术领域                  |
| 🌐 多语言回答   | 中英互译支持                      |
| 💾 历史记录     | 使用 Cloudflare D1 或 KV          |
| 🎨 UI 优化      | 聊天气泡、Markdown 渲染、流式输出 |

---

## ✅ 总结

| 类别     | 技术 / 服务                  | 备注              |
| -------- | ---------------------------- | ----------------- |
| 框架     | Mastra                       | 核心 Agent 框架   |
| 通信     | GraphQL                      | 统一前后端 schema |
| 部署     | Cloudflare Worker / Pages    | 无服务器架构      |
| 向量存储 | Cloudflare Vectorize         | 免费层足够        |
| 模型     | GPT-4o-mini                  | 英语生成能力强    |
| 前端     | React + TypeScript + urql    | 轻量高效          |
| 样式     | Tailwind + 自定义 warm tones | 避免蓝 / 紫色     |
| 成本     | 极低                         | 仅模型调用费用    |
