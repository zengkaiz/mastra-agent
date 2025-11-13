# 快速开始 - 部署到 Cloudflare Pages

## 前提条件

- ✅ Worker 已部署到 Cloudflare Workers
- ✅ 已获取 Worker URL（例如：`https://mastra-interview-worker.xxx.workers.dev`）
- ✅ 已有 Cloudflare 账户
- ✅ 代码已推送到 GitHub/GitLab（Git 集成方式）

## 5 分钟快速部署

### 步骤 1：准备 Worker URL

从 Worker 部署输出中获取 URL，格式类似：
```
https://mastra-interview-worker.xxx.workers.dev
```

### 步骤 2：创建 Cloudflare Pages 项目

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击左侧 **Pages** → **Create a project**
3. 选择 **Connect to Git**
4. 选择你的仓库

### 步骤 3：配置构建设置

```yaml
项目名称: mastra-interview-frontend
生产分支: main
框架预设: Vite
构建命令: pnpm run build
构建输出目录: dist
根目录: frontend          # ⚠️ 重要：指定 frontend 子目录
Node.js 版本: 18
```

### 步骤 4：配置环境变量

在构建设置页面下方，添加环境变量：

```
变量名: VITE_GRAPHQL_ENDPOINT
值: https://mastra-interview-worker.xxx.workers.dev/graphql
```

> 将 `xxx` 替换为你的实际 Worker URL

### 步骤 5：保存并部署

1. 点击 **Save and Deploy**
2. 等待 2-3 分钟构建完成
3. 访问提供的 Pages URL（格式：`https://xxx.pages.dev`）

## 完成！

现在你的应用已经部署成功：
- 🌐 前端：`https://xxx.pages.dev`
- ⚙️ 后端：`https://mastra-interview-worker.xxx.workers.dev`

## 后续更新

推送代码到 Git 仓库后，Cloudflare Pages 会自动构建和部署。

## 遇到问题？

参考详细文档：[DEPLOY.md](./DEPLOY.md)

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 确保 Worker 也在运行
cd ../worker && pnpm dev
```

访问 http://localhost:5173
