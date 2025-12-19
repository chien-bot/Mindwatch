# SpeakMate Backend

AI 口语教练后端服务 - 基于 FastAPI

## 功能特性

- 🎯 三种练习模式:PPT 演讲、面试、自我介绍
- 🤖 智能 AI 反馈(支持 mock 模式和真实 LLM API)
- 📝 对话上下文管理
- 🔌 预留语音接口(ASR/TTS)

## 技术栈

- **框架**: FastAPI 0.109+
- **Python**: 3.9+
- **数据验证**: Pydantic
- **异步支持**: asyncio

## 快速开始

### 1. 环境准备

确保已安装 Python 3.9 或更高版本:

```bash
python --version
```

### 2. 创建虚拟环境

```bash
# 进入 backend 目录
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

### 4. 配置环境变量

```bash
# 复制示例配置文件
cp .env.example .env

# 编辑 .env 文件(可选,默认配置已经可用)
```

### 5. 启动服务

```bash
# 方式 1: 使用 uvicorn 命令
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 方式 2: 直接运行 main.py
python -m app.main
```

服务启动后:
- API 地址: http://localhost:8000
- 交互式文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health

## API 文档

### POST /api/chat

发送消息并获取 AI 回复

**请求示例:**

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

**响应示例:**

```json
{
  "reply": "很好的开场!让我给你一些建议...",
  "mode": "ppt",
  "debug_prompt": "你是一位温和但专业的演讲教练..."
}
```

### 支持的模式

- `ppt`: PPT 演讲模式
- `interview`: 面试模式
- `self_intro`: 自我介绍模式

## 项目结构

```
backend/
├── app/
│   ├── main.py              # FastAPI 应用入口
│   ├── api/v1/
│   │   └── chat.py          # 聊天 API
│   ├── core/
│   │   ├── config.py        # 配置管理
│   │   └── llm_client.py    # LLM 客户端
│   ├── models/
│   │   └── chat.py          # 数据模型
│   └── prompts/
│       └── system_prompts.py # System Prompts
├── requirements.txt
└── .env
```

## 开发说明

### Mock 模式 vs 真实 LLM

当前默认使用 **Mock 模式** (`.env` 中 `USE_MOCK_LLM=True`),返回预设的示例回复。

要接入真实 LLM API:

1. 在 `.env` 中设置:
   ```
   USE_MOCK_LLM=False
   OPENAI_API_KEY=your-api-key-here
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_MODEL=gpt-4-turbo-preview
   ```

2. 在 `app/core/llm_client.py` 中实现 `_call_real_llm` 方法

### 扩展到语音功能

代码中已预留语音接口:

- `transcribe_audio()`: 语音识别(ASR)
- `synthesize_speech()`: 语音合成(TTS)

查看 `app/core/llm_client.py` 中的 TODO 注释了解如何接入。

## 常见问题

### 1. 端口被占用

修改启动命令中的端口:
```bash
uvicorn app.main:app --reload --port 8001
```

### 2. CORS 错误

检查 `.env` 中的 `CORS_ORIGINS` 是否包含前端地址(默认是 `http://localhost:3000`)

### 3. 模块导入错误

确保在 `backend` 目录下运行命令,且虚拟环境已激活

## License

MIT
