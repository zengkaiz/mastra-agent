# 🔧 故障排查指南

## 常见问题

### 1. 依赖安装失败

**问题：** `pnpm install` 或 `npm install` 失败

**解决方案：**

```bash
# 清除缓存
rm -rf node_modules package-lock.json pnpm-lock.yaml

# 重新安装
npm install
# 或
pnpm install
```

### 2. 运行时错误：找不到模块

**问题：** `Cannot find module '@mastra/core'` 或类似错误

**解决方案：**

- ✅ 已修复：已移除 Mastra 依赖，现在直接使用 OpenAI API
- 如果仍有问题，确保已运行 `npm install`

### 3. Wrangler 启动失败

**问题：** `wrangler dev` 无法启动

**检查清单：**

1. 确保已安装 wrangler：`npm install -g wrangler`
2. 确保已登录：`wrangler login`
3. 检查 `wrangler.toml` 配置是否正确

### 4. OpenAI API Key 未设置

**问题：** API 调用失败，401 错误

**解决方案：**

```bash
# 设置 secret（生产环境）
wrangler secret put OPENAI_API_KEY

# 或设置本地环境变量（开发环境）
export OPENAI_API_KEY="sk-xxxx"
```

### 5. Vectorize 索引不存在

**问题：** `Vectorize index not found`

**解决方案：**

```bash
# 创建索引
wrangler vectorize create frontend-assistant \
  --dimensions=1536 \
  --metric=cosine

# 验证索引
wrangler vectorize list
```

### 6. GraphQL 请求失败

**问题：** GraphQL 查询返回错误

**检查：**

1. 确保 Worker 正在运行：`wrangler dev`
2. 检查 GraphQL 端点：`http://localhost:8787/graphql`
3. 查看 Worker 日志：`wrangler tail`

### 7. CORS 错误（前端调用时）

**问题：** 浏览器控制台显示 CORS 错误

**解决方案：**
在 `worker/src/index.ts` 中添加 CORS 头（如果需要）：

```typescript
// 在返回 Response 时添加
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
```

## 调试技巧

### 查看 Worker 日志

```bash
# 实时日志
wrangler tail

# 查看特定环境的日志
wrangler tail --env production
```

### 本地测试 GraphQL

访问 `http://localhost:8787/graphql` 使用 GraphiQL 界面测试查询。

### 检查类型错误

```bash
npm run typecheck
```

## 环境变量检查

确保以下环境变量已正确设置：

**开发环境：**

- `OPENAI_API_KEY` - 通过 `wrangler secret put` 或环境变量设置

**生产环境：**

- `OPENAI_API_KEY` - 通过 `wrangler secret put OPENAI_API_KEY` 设置
- `VECTORIZE_INDEX` - 在 `wrangler.toml` 中配置

## 获取帮助

如果问题仍未解决：

1. 查看 [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
2. 检查 [GitHub Issues](https://github.com/your-repo/issues)
3. 查看 Worker 日志获取详细错误信息
