# SpeakMate 开源方案快速开始

## 问题已解决 ✅

你遇到的 "Server disconnected without sending a response" 错误已经修复!

**根本原因**: httpx 库默认会尝试使用系统代理,即使访问 localhost 也会经过代理,导致连接失败。

**解决方案**: 在 `llm_client.py` 中添加 `trust_env=False` 参数,禁用代理设置。

## 当前状态

✅ **Ollama**: 已安装并运行,qwen2.5:3b 模型已下载
✅ **edge-tts**: 已安装,可以生成中文语音
✅ **faster-whisper**: 已安装,tiny 模型已就绪
✅ **后端服务**: 运行在 http://localhost:8000
✅ **所有测试**: 通过

## 测试结果

```bash
============================================================
测试结果汇总:
============================================================
  OLLAMA: ✅ 通过
  TTS: ✅ 通过
  ASR: ✅ 通过

🎉 所有测试通过!开源方案已就绪!
```

## 快速命令

### 1. 启动后端（已在运行）

```bash
cd /Users/yaphowchien/speakmate/backend
uvicorn app.main:app --reload --port 8000
```

### 2. 测试完整功能

```bash
cd /Users/yaphowchien/speakmate/backend
python test_ollama.py
```

### 3. 检查服务状态

```bash
# 检查后端
curl http://localhost:8000/api/health

# 检查 Ollama
curl http://localhost:11434/api/tags
```

## 接下来做什么？

### 方案 1: 启动前端

```bash
cd /Users/yaphowchien/speakmate/frontend
npm run dev
```

然后访问 http://localhost:3000

### 方案 2: 测试 API 端点

```bash
# 测试对话分析（需要实际 API 端点）
curl -X POST http://localhost:8000/api/v1/conversation/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "test-123",
    "transcript": "你好,我想练习面试",
    "context": {
      "mode": "interview",
      "topic": "自我介绍"
    }
  }'
```

## 配置文件

当前 `.env` 配置:

```bash
USE_MOCK_LLM=False
USE_OPENSOURCE=True
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
WHISPER_MODEL=tiny
EDGE_TTS_VOICE=zh-CN-XiaoxiaoNeural
```

## 关键文件位置

- **LLM 客户端**: `backend/app/core/llm_client.py`
- **配置文件**: `backend/app/core/config.py`
- **环境变量**: `backend/.env`
- **测试脚本**: `backend/test_ollama.py`
- **详细文档**: `OPENSOURCE_SETUP.md`

## 性能参考（8GB 内存）

| 操作 | 响应时间 | 内存占用 |
|-----|---------|---------|
| LLM 响应 | 2-5 秒 | ~3-4GB |
| ASR 转写 | 3-10 秒 | ~200MB |
| TTS 生成 | 1-3 秒 | ~50MB |

## 常见命令

```bash
# 查看 Ollama 模型
ollama list

# 下载其他模型（如果需要）
ollama pull qwen2.5:7b

# 停止后端
lsof -ti:8000 | xargs kill -9

# 重启后端
cd backend && uvicorn app.main:app --reload
```

## 功能对比

| 功能 | 开源方案（当前） | 付费方案 |
|-----|---------------|---------|
| LLM | Ollama qwen2.5:3b | OpenAI GPT-4 |
| ASR | faster-whisper tiny | OpenAI Whisper |
| TTS | edge-tts | OpenAI TTS |
| Vision | 文字分析 | GPT-4 Vision |
| 成本 | **免费** | ~$0.50/次 |
| 响应速度 | 2-5 秒 | 1-3 秒 |

## 切换到付费方案

如果需要更快的响应速度或 Vision 功能:

```bash
# 修改 .env
USE_OPENSOURCE=False
OPENAI_API_KEY=sk-your-api-key
```

## 需要帮助？

查看详细文档: `OPENSOURCE_SETUP.md`

---

**状态**: 🟢 所有服务运行正常
**最后更新**: 2025-12-16
