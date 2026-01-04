# SpeakMate - AI 口语教练

一个基于 AI 的智能口语练习平台，支持 PPT 演讲、面试模拟和自我介绍三种练习场景，提供实时语音识别、AI 反馈和语音合成功能。

---

## 📋 目录
- [运行环境](#运行环境)
- [依赖库及安装](#依赖库及安装)
- [快速开始摘要](#快速开始摘要)
- [详细运行步骤](#详细运行步骤)
- [项目特性](#项目特性)
- [使用演示](#使用演示)
- [常见问题](#常见问题)

---

## 🖥️ 运行环境

### 必需环境
| 组件 | 版本要求 | 下载地址 |
|------|---------|---------|
| **Python** | 3.9 或以上 | [python.org/downloads](https://www.python.org/downloads/) |
| **Node.js** | 16.0 或以上 | [nodejs.org](https://nodejs.org/) |
| **npm** | 8.0 或以上 | 随 Node.js 自动安装 |
| **Ollama** | 最新版本 | [ollama.ai](https://ollama.ai/) |

### 系统级依赖（按操作系统）

**macOS:**
```bash
brew install ffmpeg poppler libreoffice
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install ffmpeg poppler-utils libreoffice
```

**Windows:**
- FFmpeg: 从 [ffmpeg.org](https://ffmpeg.org/download.html) 下载并添加到 PATH
- Poppler: 从 [GitHub](https://github.com/oschwartz10612/poppler-windows/releases/) 下载并添加到 PATH
- LibreOffice: 从 [libreoffice.org](https://www.libreoffice.org/) 下载安装

---

## 📦 依赖库及安装

### 1. 后端依赖（Python）

**依赖清单** (`backend/requirements.txt`):
```
fastapi>=0.109.0          # Web 框架
uvicorn[standard]>=0.27.0 # ASGI 服务器
pydantic>=2.5.3           # 数据验证
faster-whisper>=1.0.0     # 语音识别
edge-tts>=6.1.9           # 语音合成
python-pptx==0.6.23       # PPT 处理
pdf2image==1.17.0         # PDF 转图片
openai>=1.13.3            # OpenAI API
passlib[bcrypt]>=1.7.4    # 密码加密
python-jose[cryptography]>=3.3.0  # JWT 认证
# ... 更多依赖详见 requirements.txt
```

**安装命令**:
```bash
cd backend
pip install -r requirements.txt
```

### 2. 前端依赖（JavaScript）

**依赖清单** (`frontend/package.json`):
```json
{
  "dependencies": {
    "next": "14.0.4",           // React 框架
    "react": "18.2.0",          // UI 库
    "react-dom": "18.2.0"       // React DOM
  },
  "devDependencies": {
    "typescript": "5.3.3",      // TypeScript
    "tailwindcss": "3.4.0",     // CSS 框架
    "@types/react": "18.2.46"   // React 类型
  }
}
```

**安装命令**:
```bash
cd frontend
npm install
```

---

## ⚡ 快速开始摘要

**对于熟悉开发环境的评委，可以快速执行以下命令：**

```bash
# 1. 安装 Ollama 并下载模型
ollama pull qwen2.5:3b

# 2. 启动后端（终端 1）
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 3. 启动前端（终端 2）
cd frontend
npm install
npm run dev

# 4. 访问 http://localhost:3000
```

**详细的分步说明请参见下方。**

---

## 🚀 详细运行步骤

### 步骤 0: 安装 Ollama 并下载模型

**这一步非常重要！请务必先完成！**

1. **安装 Ollama**
   - 访问 [ollama.ai](https://ollama.ai/)
   - 下载对应系统的安装包
   - 按提示完成安装

2. **下载 AI 模型**
   ```bash
   ollama pull qwen2.5:3b
   ```
   *首次下载约需 5-10 分钟，模型大小约 2GB*

3. **验证安装**
   ```bash
   ollama list
   ```
   *应该能看到 `qwen2.5:3b` 模型*

### 步骤 1: 克隆或解压项目

```bash
# 如果从 Git 克隆
git clone <your-repo-url>
cd speakmate

# 如果是压缩包，直接解压后进入目录
cd speakmate
```

### 步骤 2: 配置后端

1. **进入后端目录**
   ```bash
   cd backend
   ```

2. **创建 Python 虚拟环境**

   **macOS/Linux:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

   **Windows (CMD):**
   ```cmd
   python -m venv venv
   venv\Scripts\activate.bat
   ```

   **Windows (PowerShell):**
   ```powershell
   python -m venv venv
   venv\Scripts\Activate.ps1
   ```

   ⚠️ **Windows 用户注意**: 如果遇到权限错误，以管理员身份运行:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **安装 Python 依赖**
   ```bash
   pip install -r requirements.txt
   ```
   *安装时间约 2-5 分钟*

4. **配置环境变量**
   ```bash
   # macOS/Linux
   cp .env.example .env

   # Windows
   copy .env.example .env
   ```

   > 💡 默认配置已可用，无需修改。配置文件使用 Ollama 本地模型，无需 API Key。

5. **启动后端服务**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   **看到以下提示说明启动成功:**
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
   INFO:     Started reloader process
   INFO:     Started server process
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   ```

6. **验证后端运行**
   - 打开浏览器访问: http://localhost:8000/health
   - 应该看到类似这样的 JSON 响应:
   ```json
   {
     "status": "ok",
     "app_name": "SpeakMate",
     "version": "1.0.0"
   }
   ```

### 步骤 3: 配置前端

**⚠️ 请打开新的终端窗口，保持后端运行！**

1. **进入前端目录**
   ```bash
   cd frontend
   # 如果你还在 backend 目录，先返回上级
   # cd ..
   # cd frontend
   ```

2. **安装前端依赖**
   ```bash
   npm install
   ```
   *安装时间约 1-3 分钟*

3. **启动前端开发服务器**
   ```bash
   npm run dev
   ```

   **看到以下提示说明启动成功:**
   ```
   ▲ Next.js 14.0.4
   - Local:        http://localhost:3000
   - Ready in 2.5s
   ```

### 步骤 4: 访问应用

1. **打开浏览器**
   - 访问: http://localhost:3000

2. **选择练习模式**
   - 点击页面上的模式选择按钮（PPT 演讲 / 面试模拟 / 自我介绍）

3. **开始使用**
   - 按照页面提示进行操作

---

## 项目特性

- 🎯 **三种练习模式**
  - PPT 演讲: 练习演讲和报告表达，**支持 AI 示范讲解**
  - 面试模拟: 模拟面试官,练习面试回答，**完整语音通话体验**
  - 自我介绍: 优化各场景的自我介绍，**支持摄像头实时练习和 AI 示范**

- 📹 **Live 练习区（自我介绍模式专属）**
  - 摄像头实时预览
  - 一键录音功能
  - 自动上传音频并获取 AI 反馈
  - 转写文本 + AI 分析（使用 faster-whisper）

- 🎤 **PPT 示范讲解（PPT 模式专属）**
  - 上传 PPT 后自动为每一页生成示范讲解
  - AI 扮演演讲者角色，示范如何讲解每一页
  - 支持语音播放示范（TTS）
  - 查看示范文字稿，按页切换
  - 先学习 AI 示范，再开始自己的演讲

- 📞 **语音面试通话（面试模式专属）**
  - 完全沉浸式语音面试体验
  - AI 面试官语音提问
  - 按住说话或空格键录音回答
  - 真实 ASR 语音识别（faster-whisper）
  - 多轮对话 + 最终评价语音播放

- 🎬 **PPT 演讲视频分析（PPT 模式专属）**
  - 录制演讲视频（摄像头 + PPT 画中画）
  - AI 自动分析演讲表现
  - 语音转写 + 结构化反馈
  - 总体评分、优点、改进建议
  - AI 生成完整示范讲解并支持 TTS 播放
  - 详细文档: [PPT_VIDEO_ANALYSIS.md](./PPT_VIDEO_ANALYSIS.md)

- 🤖 **智能 AI 反馈**
  - 实时对话反馈
  - 结构化建议
  - 示范表达

- 💬 **现代化聊天界面**
  - 实时消息展示
  - 流畅动画效果
  - 响应式设计（桌面端双栏，移动端单栏）

- 🔌 **可扩展架构**
  - 预留语音接口(ASR/TTS)
  - 支持真实 LLM API 接入
  - 模块化设计

## 技术栈

### 后端
- Python 3.9+
- FastAPI
- Pydantic
- Uvicorn
- **AI 服务（开源方案）**:
  - Ollama (qwen2.5:3b) - 对话和示范生成
  - faster-whisper (tiny 模型) - 语音识别
  - edge-tts - 语音合成

### 前端
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

## 快速开始

### 前置要求

- Python 3.9+ ([下载](https://www.python.org/downloads/))
- Node.js 18+ ([下载](https://nodejs.org/))
- npm 或 yarn
- **Ollama** ([下载](https://ollama.ai/)) - 用于本地 LLM
  - 安装后运行: `ollama pull qwen2.5:3b`
- **LibreOffice** - 用于 PPT 转换（可选，仅 PPT 模式需要）
  - macOS: `brew install libreoffice`
  - Linux: `sudo apt-get install libreoffice`
  - Windows: [官网下载](https://www.libreoffice.org/)

### 一、启动后端

1. **进入后端目录**
   ```bash
   cd backend
   ```

2. **创建虚拟环境**
   ```bash
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate

   # Windows
   python -m venv venv
   venv\Scripts\activate
   ```

3. **安装依赖**
   ```bash
   pip install -r requirements.txt
   ```

4. **配置环境变量**
   ```bash
   # 复制示例配置
   cp .env.example .env

   # 编辑 .env 文件(可选,默认配置已可用)
   ```

5. **启动后端服务**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   启动成功后:
   - API 地址: http://localhost:8000
   - 交互式文档: http://localhost:8000/docs
   - 健康检查: http://localhost:8000/health

### 二、启动前端

**打开新的终端窗口**

1. **进入前端目录**
   ```bash
   cd frontend
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

   启动成功后:
   - 前端地址: http://localhost:3000

### 步骤 4: 访问应用

1. **打开浏览器**
   - 访问: http://localhost:3000

2. **选择练习模式**
   - 点击页面上的模式选择按钮（PPT 演讲 / 面试模拟 / 自我介绍）

3. **开始使用**
   - 按照页面提示进行操作

---

## 🎬 使用演示

### 模式 1: PPT 演讲练习

1. **上传 PPT 文件**
   - 点击"选择文件"按钮
   - 支持 PDF、PPT、PPTX 格式（最大 50MB）
   - 系统自动将 PPT 转换为图片并提取文本

2. **查看 AI 示范讲解**
   - 上传后自动为每一页生成示范讲解话术
   - 点击播放按钮，听 AI 如何讲解每一页
   - 展开查看完整的示范讲解文本

3. **开始演讲练习**
   - 学习完 AI 示范后，开始自己的演讲练习
   - 在聊天框输入演讲内容或录制演讲视频
   - 获取 AI 分析和改进建议

### 模式 2: 面试模拟

1. **选择面试岗位**
   - 选择前端、后端、产品、数据等职位

2. **开始语音面试**
   - 5 秒倒计时准备
   - AI 面试官语音提问
   - 按住"按住说话"按钮或空格键录音回答

3. **完成面试**
   - 完成 4 轮面试问题
   - 获取最终评价（语音播放）

### 模式 3: 自我介绍练习

1. **听 AI 示范**
   - 点击播放按钮，听 AI 的示范自我介绍

2. **摄像头练习**
   - 开启摄像头，对着镜头练习
   - 点击录制按钮，说出自我介绍

3. **获取反馈**
   - AI 自动转写语音内容
   - 给出改进建议和示范

## 项目结构

```
speakmate/
├── backend/                  # 后端目录
│   ├── app/
│   │   ├── main.py          # FastAPI 应用入口
│   │   ├── api/v1/
│   │   │   ├── chat.py      # 聊天 API
│   │   │   └── self_intro_audio.py  # 音频上传 API（新增）
│   │   ├── core/
│   │   │   ├── config.py    # 配置管理
│   │   │   └── llm_client.py # LLM 客户端
│   │   ├── models/
│   │   │   ├── chat.py      # 聊天数据模型
│   │   │   └── audio.py     # 音频数据模型（新增）
│   │   └── prompts/
│   │       └── system_prompts.py # System Prompts
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/                 # 前端目录
│   ├── src/
│   │   ├── pages/           # Next.js 页面
│   │   │   └── index.tsx    # 主页
│   │   ├── components/      # React 组件
│   │   │   ├── ChatWindow.tsx       # 聊天窗口容器
│   │   │   ├── ModeSelector.tsx     # 模式选择器
│   │   │   ├── MessageList.tsx      # 消息列表
│   │   │   ├── MessageInput.tsx     # 消息输入框
│   │   │   └── SelfIntroLivePanel.tsx  # Live 练习面板（新增）
│   │   ├── lib/             # 工具函数
│   │   │   └── api.ts       # API 调用封装
│   │   ├── types/           # TypeScript 类型
│   │   │   └── chat.ts      # 聊天类型定义
│   │   └── styles/          # 样式文件
│   │       └── globals.css  # 全局样式
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
└── README.md                 # 项目总说明(本文件)
```

## API 文档

### POST /api/chat

发送消息并获取 AI 回复

**请求:**
```json
{
  "mode": "ppt",
  "message": "今天我想和大家分享一下我们的项目进展",
  "history": [
    {
      "role": "user",
      "content": "你好"
    },
    {
      "role": "assistant",
      "content": "你好!我是你的演讲教练"
    }
  ]
}
```

**响应:**
```json
{
  "reply": "很好的开场!让我给你一些建议...",
  "mode": "ppt",
  "debug_prompt": "..."
}
```

### POST /api/v1/self_intro/audio

上传自我介绍音频并获取反馈（新增接口）

**请求:**
- Content-Type: `multipart/form-data`
- Body: 包含音频文件的 FormData，字段名为 `file`

**响应:**
```json
{
  "transcript": "大家好，我叫小明，目前是高中二年级学生...",
  "reply": "很好的自我介绍！让我给你一些改进建议...",
  "mode": "self_intro"
}
```

**注意事项:**
- 目前该接口使用 Mock 转写数据，返回固定示例文本
- 将来接入真实 ASR 后，会返回实际的语音转写结果
- 详见代码中的 TODO 注释

### GET /api/health

健康检查

**响应:**
```json
{
  "status": "ok",
  "app_name": "SpeakMate",
  "version": "1.0.0",
  "use_mock_llm": true
}
```

## 开发说明

### Mock 模式 vs 真实 LLM

**当前状态:**
- 默认使用 **Mock 模式** (`USE_MOCK_LLM=True`)
- 返回预设的示例回复,无需真实 API Key
- 适合开发和测试

**接入真实 LLM:**

1. 在 `backend/.env` 中配置:
   ```
   USE_MOCK_LLM=False
   OPENAI_API_KEY=your-api-key-here
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_MODEL=gpt-4-turbo-preview
   ```

2. 在 `backend/app/core/llm_client.py` 中实现 `_call_real_llm` 方法

3. 安装 OpenAI SDK:
   ```bash
   pip install openai
   ```

### 接入真实的语音识别（ASR）

目前自我介绍 Live 练习区使用 Mock 转写数据。接入真实 ASR 的步骤：

**1. 选择 ASR 服务提供商**
- OpenAI Whisper（推荐，支持中文）
- Google Cloud Speech-to-Text
- Azure Speech Service
- 阿里云、腾讯云等国内服务

**2. 修改后端代码**

在 [backend/app/api/v1/self_intro_audio.py](backend/app/api/v1/self_intro_audio.py) 中：

找到 `mock_transcribe_audio` 函数（约 93 行），替换成真实的 ASR 调用。

示例（使用 OpenAI Whisper）：
```python
# 安装依赖
# pip install openai

from openai import AsyncOpenAI
from app.core.config import settings

async def transcribe_audio_with_whisper(audio_content: bytes, filename: str) -> str:
    """使用 OpenAI Whisper 转写音频"""
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    # 保存临时文件
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
        temp_file.write(audio_content)
        temp_path = temp_file.name

    # 调用 Whisper API
    with open(temp_path, "rb") as audio_file:
        transcript = await client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="zh"  # 指定中文
        )

    # 删除临时文件
    import os
    os.remove(temp_path)

    return transcript.text
```

然后在接口函数中替换：
```python
# 原来的 Mock 调用
# transcript_text = await mock_transcribe_audio(audio_content, file.filename)

# 改成真实 ASR
transcript_text = await transcribe_audio_with_whisper(audio_content, file.filename)
```

**3. 配置环境变量**

在 `backend/.env` 中添加：
```
OPENAI_API_KEY=your-api-key-here
```

**4. 测试**
重启后端，在前端录制真实音频，查看转写效果。

## 常见问题

### 1. 后端启动失败

**问题**: `ModuleNotFoundError: No module named 'app'`

**解决**:
- 确保在 `backend` 目录下运行命令
- 确保虚拟环境已激活
- 重新安装依赖: `pip install -r requirements.txt`

### 2. 前端无法连接后端

**问题**: `Failed to fetch` 或 CORS 错误

**解决**:
- 检查后端是否启动: 访问 http://localhost:8000/health
- 检查 `backend/.env` 中 `CORS_ORIGINS` 包含 `http://localhost:3000`
- 检查浏览器控制台的详细错误信息

### 3. 端口被占用

**后端端口冲突**:
```bash
# 使用其他端口
uvicorn app.main:app --reload --port 8001

# 前端需要相应修改 .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

**前端端口冲突**:
```bash
npm run dev -- -p 3001
```

### 4. 虚拟环境激活失败(Windows)

**问题**: PowerShell 执行策略限制

**解决**:
```powershell
# 以管理员身份运行 PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 然后重新激活虚拟环境
venv\Scripts\activate
```

## 功能路线图

- [x] 基础聊天功能
- [x] 三种练习模式
- [x] Mock LLM 响应
- [x] 自我介绍 Live 练习区（摄像头 + 录音）
- [x] 音频上传接口（Mock 转写）
- [x] 响应式设计（桌面/移动端）
- [x] 真实 LLM API 接入（Ollama + qwen2.5:3b）
- [x] 真实语音识别(ASR)接入（faster-whisper）
- [x] 语音合成(TTS)（edge-tts）
- [x] **PPT 示范讲解功能**
  - [x] 上传 PPT 自动生成示范话术
  - [x] AI 扮演演讲者示范讲解
  - [x] 语音播放示范
  - [x] 按页切换查看示范
- [x] **面试语音通话功能**
  - [x] 5 秒倒计时准备
  - [x] 完整语音面试体验
  - [x] 真实音频录制上传
  - [x] 空格键录音支持
  - [x] 多轮对话 + 语音评价
- [x] **PPT 演讲视频分析功能**
  - [x] 录制演讲视频并上传分析
  - [x] AI 转写演讲内容（ASR）
  - [x] 结构化分析反馈（评分、优点、改进建议）
  - [x] AI 生成完整示范讲解
  - [x] TTS 播放示范讲解
  - [x] 精美可视化分析结果展示
- [ ] 用户认证和登录
- [ ] 会话历史保存
- [ ] 多语言支持
- [ ] PPT 演讲分析历史记录
- [ ] 面试历史记录

## 贡献指南

欢迎提交 Issue 和 Pull Request!

## License

MIT

## 联系方式

如有问题或建议,请提交 Issue。
