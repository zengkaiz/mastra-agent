# 🚀 快速启动指南（使用 Mastra 框架）

## 1. 安装依赖

```bash
cd worker

# 清除旧的依赖（如果之前安装过）
rm -rf node_modules package-lock.json pnpm-lock.yaml

# 安装新依赖
npm install
# 或
pnpm install
```

**重要依赖说明：**

- `@mastra/core` - Mastra AI Agent 框架
- `@ai-sdk/openai` - OpenAI 模型集成
- `ai` - AI SDK 核心库
- `zod` - Schema 验证库
- `graphql-yoga` - GraphQL 服务器（支持 Cloudflare Workers）
- `graphql` - GraphQL 核心库

## 2. 设置 OpenAI API Key

**开发环境（推荐使用环境变量）：**

```bash
export OPENAI_API_KEY="sk-xxxx"
```

**生产环境（使用 wrangler secret）：**

```bash
wrangler secret put OPENAI_API_KEY
# 输入提示时，粘贴您的 OpenAI API Key
```

## 3. 创建 Vectorize 索引（首次运行）

```bash
wrangler vectorize create frontend-assistant \
  --dimensions=1536 \
  --metric=cosine \
  --description="Frontend interview assistant knowledge base"
```

## 4. 启动开发服务器

```bash
npm run dev
# 或
wrangler dev
```

## 5. 测试

**健康检查：**

```bash
curl http://localhost:8787/health
```

应该返回：

```json
{ "status": "ok" }
```

**GraphQL 界面：**
访问 `http://localhost:8787/graphql` 使用 GraphiQL

**测试查询：**

```graphql
query {
  chat(message: "What is React?") {
    reply
  }
}
```

## 常见问题

### 1. 依赖安装失败

```bash
# 清除所有缓存
rm -rf node_modules package-lock.json pnpm-lock.yaml
npm cache clean --force

# 重新安装
npm install
```

### 2. Mastra 相关错误

确保安装了正确的包：

- `@mastra/core` （不是 `@mastra/ai`）
- `@ai-sdk/openai` （不是 `@mastra/openai`）

### 3. Vectorize 索引错误

```bash
# 查看现有索引
wrangler vectorize list

# 如果需要删除重建
wrangler vectorize delete frontend-assistant
wrangler vectorize create frontend-assistant --dimensions=1536 --metric=cosine
```

### 4. OpenAI API Key 未设置

开发环境确保环境变量已设置：

```bash
echo $OPENAI_API_KEY
```

如果为空，设置它：

```bash
export OPENAI_API_KEY="sk-xxxx"
```

### 5. Worker 启动失败

检查 wrangler 版本：

```bash
wrangler --version
```

如果版本过旧，更新：

```bash
npm install -g wrangler@latest
```

## Mastra Agent 说明

项目使用 Mastra 框架构建 AI Agent：

- **Agent**：`src/agent.ts` - 面试辅导助手
- **Tool**：`src/knowledge-tool.ts` - 知识库检索工具
- **Model**：OpenAI GPT-4o-mini

Agent 会自动使用知识库工具检索相关信息，并生成个性化的面试回答。

## 下一步

- 查看 [DEPLOYMENT.md](../DEPLOYMENT.md) 了解部署说明
- 查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 解决其他问题
- 访问 [Mastra 文档](https://mastra.ai/) 了解更多 Mastra 用法
