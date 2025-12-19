# SpeakMate 快速启动指南 🚀

这是一个精简的启动指南，帮你在 5 分钟内运行整个项目。

## 前置准备

确保你已安装：
- ✅ Python 3.9+
- ✅ Node.js 18+

## 第一步：启动后端（2 分钟）

```bash
# 1. 进入后端目录
cd backend

# 2. 创建虚拟环境
python3 -m venv venv

# 3. 激活虚拟环境
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 4. 安装依赖
pip install -r requirements.txt

# 5. 启动后端
uvicorn app.main:app --reload
```

✅ 看到 `Application startup complete.` 就说明后端启动成功了！

打开 http://localhost:8000/docs 查看 API 文档。

---

## 第二步：启动前端（2 分钟）

**打开新的终端窗口**，然后：

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖
npm install

# 3. 启动前端
npm run dev
```

✅ 看到 `Ready on http://localhost:3000` 就说明前端启动成功了！

---

## 第三步：开始使用（1 分钟）

1. 打开浏览器，访问 http://localhost:3000
2. 选择 **"自我介绍"** 模式
3. 允许浏览器访问摄像头和麦克风
4. 点击 **"开始录制"**，对着摄像头说一段自我介绍
5. 点击 **"停止录制"**，等待 AI 分析
6. 查看右侧的转写文本和 AI 反馈

**注意**：当前使用 Mock 数据，所以转写文本是固定的示例。将来接入真实 ASR 后会转写你的实际语音。

---

## 功能演示

### 1. 文字聊天模式（所有模式都支持）
- 在底部输入框输入消息
- 按 Enter 发送
- AI 教练会给你反馈

### 2. Live 练习模式（仅自我介绍模式）
- 左侧：摄像头预览 + 录音按钮
- 右侧：聊天记录 + AI 反馈
- 录音完成后，转写文本和反馈会自动显示

### 3. 切换模式
顶部有三个按钮：
- 📊 **PPT 演讲**：练习演讲表达
- 💼 **面试模拟**：模拟面试问答
- 👋 **自我介绍**：优化自我介绍（支持 Live 练习）

---

## 常见问题

### Q1: 后端启动失败 `ModuleNotFoundError`
**解决**：确保你在 `backend` 目录下，且虚拟环境已激活。

```bash
cd backend
source venv/bin/activate  # 先激活虚拟环境
pip install -r requirements.txt  # 重新安装依赖
```

### Q2: 前端无法连接后端 `Failed to fetch`
**解决**：
1. 检查后端是否启动：访问 http://localhost:8000/health
2. 如果后端没启动，回到第一步重新启动

### Q3: 摄像头/麦克风无法访问
**解决**：
1. 检查浏览器权限设置（通常在地址栏左侧）
2. 使用 Chrome 或 Edge 浏览器（兼容性更好）
3. 确保没有其他应用占用摄像头（如 Zoom、Teams）

### Q4: 端口被占用
**后端 8000 端口被占用**：
```bash
# 使用其他端口启动
uvicorn app.main:app --reload --port 8001

# 前端需要修改 API 地址（在 .env.local 中）
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

**前端 3000 端口被占用**：
```bash
npm run dev -- -p 3001
```

---

## 下一步：接入真实 API

当前项目使用 Mock 数据（LLM 和 ASR 都是假数据）。如果你想接入真实 API：

### 接入真实 LLM（如 OpenAI GPT）
1. 在 `backend/.env` 中配置：
   ```
   USE_MOCK_LLM=False
   OPENAI_API_KEY=your-api-key
   ```
2. 修改 `backend/app/core/llm_client.py` 实现真实调用
3. 重启后端

详见主 [README.md](README.md#开发说明)

### 接入真实语音识别（如 Whisper）
1. 在 `backend/.env` 中添加：
   ```
   OPENAI_API_KEY=your-api-key
   ```
2. 修改 `backend/app/api/v1/self_intro_audio.py`，替换 `mock_transcribe_audio` 函数
3. 重启后端

详见主 [README.md](README.md#接入真实的语音识别asr)

---

## 项目结构速览

```
speakmate/
├── backend/           # 后端（Python + FastAPI）
│   ├── app/
│   │   ├── api/v1/   # API 接口
│   │   ├── core/     # 核心逻辑（LLM 客户端、配置等）
│   │   ├── models/   # 数据模型
│   │   └── prompts/  # AI Prompt 定义
│   └── requirements.txt
│
└── frontend/          # 前端（Next.js + React + TypeScript）
    ├── src/
    │   ├── pages/     # 页面
    │   ├── components/  # React 组件
    │   ├── lib/       # API 调用
    │   └── styles/    # 样式
    └── package.json
```

---

## 技术支持

遇到问题？查看详细文档：
- 📖 [完整 README](README.md)
- 🔧 [API 文档](http://localhost:8000/docs)（需先启动后端）

祝你使用愉快！🎉
