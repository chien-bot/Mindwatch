# SpeakMate Frontend

AI 口语教练前端应用 - 基于 Next.js + React + TypeScript

## 功能特性

- 🎨 现代化 UI 设计(Tailwind CSS)
- 💬 实时聊天界面
- 🔄 三种练习模式切换
- 📱 响应式布局
- ⚡ 快速加载和流畅动画

## 技术栈

- **框架**: Next.js 14
- **UI 库**: React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **HTTP 客户端**: Fetch API

## 快速开始

### 1. 环境准备

确保已安装 Node.js 18 或更高版本:

```bash
node --version
npm --version
```

### 2. 安装依赖

```bash
# 进入 frontend 目录
cd frontend

# 安装依赖
npm install
```

### 3. 配置环境变量(可选)

如果后端不在默认地址(`http://localhost:8000`),创建 `.env.local` 文件:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:3000

## 可用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 运行 ESLint 检查
```

## 项目结构

```
frontend/
├── src/
│   ├── pages/
│   │   ├── _app.tsx         # Next.js App 配置
│   │   └── index.tsx        # 主页面
│   ├── components/
│   │   ├── ChatWindow.tsx   # 聊天窗口容器
│   │   ├── ModeSelector.tsx # 模式选择器
│   │   ├── MessageList.tsx  # 消息列表
│   │   └── MessageInput.tsx # 消息输入框
│   ├── lib/
│   │   └── api.ts           # API 调用封装
│   ├── types/
│   │   └── chat.ts          # TypeScript 类型定义
│   └── styles/
│       └── globals.css      # 全局样式
├── package.json
├── tsconfig.json
└── next.config.js
```

## 组件说明

### ChatWindow

主聊天容器,管理整个应用的状态:
- 当前模式(mode)
- 消息历史(messages)
- 加载状态(isLoading)
- 错误处理(error)

### ModeSelector

模式选择器,支持三种模式:
- `ppt`: PPT 演讲
- `interview`: 面试模拟
- `self_intro`: 自我介绍

### MessageList

消息列表,展示对话历史:
- 用户消息(右侧,蓝色气泡)
- AI 回复(左侧,白色气泡)
- 加载指示器
- 自动滚动到底部

### MessageInput

消息输入框:
- 多行文本输入
- Enter 发送,Shift+Enter 换行
- 禁用状态(加载时)

## API 集成

### 调用后端接口

所有 API 调用都封装在 `src/lib/api.ts` 中:

```typescript
import { sendChatMessage } from '@/lib/api';

const response = await sendChatMessage({
  mode: 'ppt',
  message: '用户输入的消息',
  history: [...], // 可选
});
```

### 配置 API 地址

1. 通过环境变量(推荐):
   ```bash
   # .env.local
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

2. 直接修改 `src/lib/api.ts` 中的 `API_BASE_URL`

## 样式定制

### Tailwind CSS

项目使用 Tailwind CSS,可以在 `tailwind.config.js` 中自定义:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // 自定义颜色
      },
    },
  },
}
```

### 全局样式

修改 `src/styles/globals.css` 来调整全局样式和动画。

## 扩展功能

### 将来接入语音功能

在 `src/lib/api.ts` 中预留了语音相关函数:

- `transcribeAudio()`: 语音识别(ASR)
- `synthesizeSpeech()`: 语音合成(TTS)

接入步骤:
1. 实现这两个函数的 API 调用
2. 在组件中添加录音/播放功能
3. 更新 UI 添加语音按钮

### 添加用户认证

可以集成:
- NextAuth.js
- Firebase Auth
- 自定义认证系统

### 会话持久化

可以使用:
- LocalStorage(简单方案)
- IndexedDB(大量数据)
- 后端数据库(需要登录)

## 常见问题

### 1. 端口被占用

修改端口:
```bash
npm run dev -- -p 3001
```

### 2. 无法连接后端

- 检查后端是否启动(`http://localhost:8000/health`)
- 检查 CORS 配置
- 查看浏览器控制台错误信息

### 3. 样式不生效

- 确保 Tailwind CSS 配置正确
- 运行 `npm run dev` 重启开发服务器
- 清除浏览器缓存

## 性能优化建议

1. **代码分割**: Next.js 自动进行代码分割
2. **图片优化**: 使用 Next.js `<Image>` 组件
3. **懒加载**: 使用 `dynamic import` 延迟加载组件
4. **缓存**: 配置适当的缓存策略

## License

MIT
