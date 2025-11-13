# 部署到 Cloudflare Pages

## 项目概述

这是一个基于 React + Vite + TypeScript 的前端应用，使用 Cloudflare Pages 进行部署。

## 部署方式

Cloudflare Pages 支持两种部署方式：
1. **Git 集成部署**（推荐）- 连接 GitHub/GitLab，自动部署
2. **Direct Upload** - 手动上传构建产物

## 方式一：Git 集成部署（推荐）

### 1. 推送代码到 Git 仓库

确保你的代码已推送到 GitHub 或 GitLab。

### 2. 创建 Cloudflare Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** 页面
3. 点击 **Create a project**
4. 选择 **Connect to Git**
5. 授权并选择你的仓库
6. 配置构建设置：

```
项目名称: mastra-interview-frontend
生产分支: main (或你的主分支)
框架预设: Vite
构建命令: pnpm run build
构建输出目录: dist
根目录: frontend
Node.js 版本: 18 或更高
```

### 3. 配置环境变量

在 Cloudflare Pages 项目设置中，添加环境变量：

**生产环境变量：**
```
VITE_GRAPHQL_ENDPOINT=https://mastra-interview-worker.your-subdomain.workers.dev/graphql
```

**预览环境变量（可选）：**
```
VITE_GRAPHQL_ENDPOINT=https://mastra-interview-worker.your-subdomain.workers.dev/graphql
```

> ⚠️ 重要：将 `your-subdomain` 替换为你的 Cloudflare Workers 实际 URL

### 4. 部署

- 推送代码到 Git 仓库后，Cloudflare Pages 会自动构建和部署
- 每次推送都会触发新的部署
- 可以在 Cloudflare Dashboard 查看部署状态和日志

---

## 方式二：Direct Upload（手动部署）

### 1. 本地构建

```bash
# 设置环境变量（创建 .env 文件）
echo "VITE_GRAPHQL_ENDPOINT=https://mastra-interview-worker.your-subdomain.workers.dev/graphql" > .env

# 安装依赖
pnpm install

# 构建
pnpm build
```

### 2. 使用 Wrangler 部署

```bash
# 安装 wrangler（如果还没安装）
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署到 Pages
wrangler pages deploy dist --project-name=mastra-interview-frontend
```

### 3. 后续部署

每次更新后，只需运行：

```bash
pnpm build
wrangler pages deploy dist --project-name=mastra-interview-frontend
```

---

## 本地开发

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:5173
```

本地开发时，GraphQL 请求会通过 Vite proxy 转发到 `http://127.0.0.1:8787/graphql`（Worker 开发服务器）。

---

## 环境变量说明

### VITE_GRAPHQL_ENDPOINT

GraphQL API 端点 URL。

**不同环境的值：**
- 本地开发：`http://localhost:8787/graphql`（由 Vite proxy 处理）
- 生产环境：`https://mastra-interview-worker.your-subdomain.workers.dev/graphql`

> 💡 提示：Vite 环境变量必须以 `VITE_` 开头才能在客户端代码中访问。

---

## 部署后验证

### 1. 检查部署状态

访问你的 Cloudflare Pages URL：
```
https://mastra-interview-frontend.pages.dev
```

### 2. 测试 API 连接

打开浏览器开发者工具，检查：
- Network 标签中是否有对 GraphQL API 的请求
- Console 是否有错误信息

### 3. 常见问题排查

**问题：CORS 错误**
- 确保 Worker 端已正确配置 CORS headers
- 检查 `worker/src/graphql-server.ts` 中的 CORS 配置

**问题：API 请求 404**
- 检查 `VITE_GRAPHQL_ENDPOINT` 环境变量是否正确
- 确认 Worker 已成功部署并可访问

**问题：构建失败**
- 检查 Node.js 版本（需要 18+）
- 确认使用 pnpm 而不是 npm
- 查看 Cloudflare Pages 构建日志

---

## 更新 Worker URL

当 Worker 部署完成后，你需要更新前端的 GraphQL endpoint：

### 在 Git 集成模式下：

1. 获取 Worker URL（部署 Worker 后显示）
2. 在 Cloudflare Pages 项目设置中更新环境变量：
   ```
   VITE_GRAPHQL_ENDPOINT=https://mastra-interview-worker.your-subdomain.workers.dev/graphql
   ```
3. 触发重新部署（推送新提交或在 Dashboard 手动触发）

### 在 Direct Upload 模式下：

1. 更新本地 `.env` 文件
2. 重新构建：`pnpm build`
3. 重新部署：`wrangler pages deploy dist --project-name=mastra-interview-frontend`

---

## 自定义域名（可选）

### 添加自定义域名

1. 在 Cloudflare Pages 项目中，进入 **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名（如 `app.yourdomain.com`）
4. 按照提示配置 DNS 记录
5. 等待 SSL 证书自动配置

---

## 文件说明

### 配置文件

- `cloudflare-pages.json` - Cloudflare Pages 构建配置
- `vite.config.ts` - Vite 构建工具配置
- `public/_headers` - Cloudflare Pages HTTP headers 配置
- `public/_redirects` - SPA 路由重定向配置（所有路由指向 index.html）

### 安全 Headers

`public/_headers` 文件配置了以下安全 headers：
- `X-Frame-Options: DENY` - 防止点击劫持
- `X-Content-Type-Options: nosniff` - 防止 MIME 类型嗅探
- `Referrer-Policy: strict-origin-when-cross-origin` - Referrer 策略
- `Permissions-Policy` - 禁用不必要的浏览器功能

---

## 性能优化建议

1. **启用 Cloudflare CDN 缓存**
   - 静态资源自动缓存在全球 CDN 节点
   - 提供超快的加载速度

2. **使用 Cloudflare Analytics**
   - 在 Cloudflare Dashboard 查看网站访问数据
   - 免费且不影响性能

3. **优化构建产物**
   - Vite 已自动进行代码分割和压缩
   - 可以在 `vite.config.ts` 中进一步优化

---

## 成本说明

Cloudflare Pages 免费套餐包括：
- ✅ 每月 500 次构建
- ✅ 无限带宽
- ✅ 无限请求
- ✅ 全球 CDN
- ✅ 自动 HTTPS

对于大多数项目来说，免费套餐已经足够使用。

---

## 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Vite 文档](https://vitejs.dev/)
- [Worker 部署文档](../worker/DEPLOY.md)
