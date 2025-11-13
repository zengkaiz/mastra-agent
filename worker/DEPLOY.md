# 部署到 Cloudflare Workers

## 前置要求

1. 安装 wrangler CLI (已包含在项目依赖中)
2. 拥有 Cloudflare 账户
3. 准备好 OpenAI API Key

## 首次部署步骤

### 1. 登录 Cloudflare

```bash
npx wrangler login
```

### 2. 创建 Vectorize 索引

```bash
wrangler vectorize create frontend-assistant \
  --dimensions=1536 \
  --metric=cosine \
  --description="Frontend interview assistant knowledge base"
```

### 3. 设置 OpenAI API Key

```bash
wrangler secret put OPENAI_API_KEY
# 系统会提示你输入 API Key
```

### 4. 部署

```bash
pnpm cf:deploy
```

## 后续部署

完成首次设置后，之后只需运行：

```bash
pnpm cf:deploy
```

## 本地开发

```bash
pnpm dev
```

服务器将运行在 `http://localhost:8787`

## 常用命令

```bash
# 查看 Vectorize 索引列表
wrangler vectorize list

# 查看部署状态
wrangler deployments list

# 查看日志
wrangler tail

# 删除 Worker（如果有多余的）
wrangler delete mastra-interview-worker-production

# 删除 Vectorize 索引（如果需要重建）
wrangler vectorize delete frontend-assistant
```

## 环境变量

- `OPENAI_API_KEY`: OpenAI API 密钥（通过 wrangler secret 设置）
- `VECTORIZE_INDEX`: Vectorize 索引名称（在 wrangler.toml 中配置）

## 清理多余的 Worker

如果你之前部署时创建了多个 worker（比如 `mastra-interview-worker-production`），可以删除不需要的：

```bash
# 删除多余的 production worker
wrangler delete mastra-interview-worker-production

# 现在只保留 mastra-interview-worker
```

## 注意事项

- 现在配置只使用单个默认环境，不再使用 `--env` 参数
- Vectorize Index 不支持本地开发，需要部署到 Cloudflare 才能完整测试
- 如果需要更新 OPENAI_API_KEY，使用 `wrangler secret put OPENAI_API_KEY` 命令
- Worker 名称：`mastra-interview-worker`
