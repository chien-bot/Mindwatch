# GitHub Pages 部署指南

本项目前端支持部署到 GitHub Pages。按照以下步骤操作：

## 📋 部署步骤

### 1. 启用 GitHub Pages

1. 访问你的 GitHub 仓库：https://github.com/chien-bot/Mindwatch
2. 点击 **Settings**（设置）
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 部分选择：
   - Source: **GitHub Actions**
5. 保存设置

### 2. 配置后端 API URL

在推送代码之前，需要修改 `.github/workflows/deploy.yml` 文件中的后端 API 地址：

```yaml
env:
  NEXT_PUBLIC_API_BASE_URL: https://your-backend-api-url.com
```

将 `https://your-backend-api-url.com` 替换为你的实际后端服务器地址。

**注意：** 由于 GitHub Pages 只能托管静态文件，你需要单独部署后端服务。

### 3. 推送代码触发部署

```bash
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

推送后，GitHub Actions 会自动：
1. 安装依赖
2. 构建 Next.js 应用
3. 部署到 GitHub Pages

### 4. 查看部署状态

1. 访问仓库的 **Actions** 标签页
2. 查看 "Deploy to GitHub Pages" 工作流的运行状态
3. 部署成功后，你的网站将在以下地址可用：
   - `https://chien-bot.github.io/Mindwatch/` （如果使用子路径）
   - 或自定义域名（如果已配置）

## 🔧 配置选项

### 使用子路径部署

如果你的网站部署在 `username.github.io/Mindwatch`，需要取消注释 `next.config.js` 中的这些行：

```javascript
basePath: '/Mindwatch',
assetPrefix: '/Mindwatch',
```

### 使用自定义域名

1. 在仓库的 **Settings > Pages** 中设置自定义域名
2. 添加 DNS 记录指向 GitHub Pages
3. 等待 DNS 传播完成

## 🚀 后端部署建议

前端部署到 GitHub Pages 后，你还需要部署后端服务。推荐的选项：

1. **Render.com**（免费）
   - 支持 Python FastAPI
   - 自动从 GitHub 部署
   - 提供免费的 HTTPS

2. **Railway.app**（免费额度）
   - 简单的部署流程
   - 支持 FastAPI

3. **Heroku**（付费）
   - 成熟的平台
   - 良好的文档

4. **自己的服务器**
   - 完全控制
   - 需要配置 HTTPS 和 CORS

## 📝 注意事项

1. **CORS 配置**：确保后端的 CORS 设置允许来自 GitHub Pages 域名的请求
2. **HTTPS**：GitHub Pages 强制使用 HTTPS，后端 API 也应该使用 HTTPS
3. **环境变量**：生产环境的 API URL 需要在 workflow 文件中配置
4. **构建时间**：首次部署可能需要几分钟

## 🔍 故障排除

### 部署失败

- 检查 Actions 标签页中的错误日志
- 确保 `package.json` 和 `package-lock.json` 是最新的
- 验证 Node.js 版本兼容性

### 页面显示 404

- 确保已在 Settings > Pages 中启用 GitHub Actions
- 检查是否需要配置 `basePath`
- 清除浏览器缓存

### API 请求失败

- 检查 `NEXT_PUBLIC_API_BASE_URL` 是否正确
- 确保后端 CORS 配置正确
- 验证后端服务是否正常运行
