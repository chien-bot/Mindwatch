# SpeakMate 开源方案配置指南

本指南帮助你在 **8GB 内存** 的机器上使用完全免费的开源方案运行 SpeakMate。

## 方案概览

| 功能 | 开源方案 | 付费方案 |
|-----|---------|---------|
| **LLM** | Ollama + Qwen2.5:3b | OpenAI GPT-4 |
| **ASR** | faster-whisper (tiny) | OpenAI Whisper |
| **TTS** | edge-tts | OpenAI TTS |
| **Vision** | 文字分析替代 | GPT-4 Vision |
| **成本** | **完全免费** | ~$0.50/次 |

## 第一步：安装 Ollama

### macOS

```bash
# 使用 Homebrew 安装
brew install ollama

# 或者下载安装包
# https://ollama.ai/download
```

### Linux

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows

从 https://ollama.ai/download 下载安装包

## 第二步：下载轻量级模型

```bash
# 启动 Ollama 服务
ollama serve

# 在另一个终端下载模型（3B 参数，适合 8GB 内存）
ollama pull qwen2.5:3b
```

**模型大小参考**：
- `qwen2.5:3b` - ~2GB，8GB 内存推荐
- `qwen2.5:7b` - ~4GB，16GB 内存推荐
- `llama3.2:3b` - ~2GB，备选

## 第三步：安装 Python 依赖

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt
```

## 第四步：配置环境变量

创建或编辑 `backend/.env`：

```bash
# 开发模式
DEBUG=True

# 关闭 Mock 模式，启用开源方案
USE_MOCK_LLM=False
USE_OPENSOURCE=True

# Ollama 配置
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b

# Whisper 配置（8GB 推荐 tiny）
WHISPER_MODEL=tiny

# edge-tts 语音
EDGE_TTS_VOICE=zh-CN-XiaoxiaoNeural
```

## 第五步：启动服务

```bash
# 终端 1：启动 Ollama
ollama serve

# 终端 2：启动后端
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# 终端 3：启动前端
cd frontend
npm run dev
```

## 验证安装

### 测试 Ollama

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "qwen2.5:3b",
  "messages": [{"role": "user", "content": "你好"}],
  "stream": false
}'
```

### 测试 edge-tts

```bash
python -c "
import asyncio
import edge_tts

async def test():
    communicate = edge_tts.Communicate('你好，这是测试', 'zh-CN-XiaoxiaoNeural')
    await communicate.save('test.mp3')
    print('成功！请播放 test.mp3')

asyncio.run(test())
"
```

### 测试 faster-whisper

```bash
python -c "
from faster_whisper import WhisperModel
model = WhisperModel('tiny', device='cpu', compute_type='int8')
print('Whisper 模型加载成功！')
"
```

## 内存优化建议

如果遇到内存不足问题：

### 1. 使用更小的 Whisper 模型

```bash
# 在 .env 中设置
WHISPER_MODEL=tiny  # 最小，~75MB
```

### 2. 关闭不需要的应用

Ollama 运行时会占用 ~3-4GB 内存

### 3. 使用 Swap（虚拟内存）

```bash
# macOS/Linux - 检查 swap
swapon --show

# 如果没有 swap，创建 4GB swap 文件
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 可用的 TTS 语音

edge-tts 支持多种中文语音：

| 语音 | 描述 |
|-----|------|
| `zh-CN-XiaoxiaoNeural` | 女声，温柔 |
| `zh-CN-YunxiNeural` | 男声，自然 |
| `zh-CN-YunyangNeural` | 男声，新闻风格 |
| `zh-CN-XiaoyiNeural` | 女声，活泼 |

查看所有可用语音：

```bash
edge-tts --list-voices | grep zh-CN
```

## 功能限制说明

### Vision（图片识别）

8GB 内存无法运行本地 Vision 模型，开源方案会：
- 使用 PPT 提取的文字内容进行分析
- 无法识别 PPT 中的图表和图片

**如果需要 Vision 功能**：
1. 升级到 16GB+ 内存
2. 或使用付费方案（GPT-4 Vision）

### 响应速度

本地模型响应速度取决于 CPU：
- **M1/M2 Mac**: 较快（约 2-5 秒）
- **Intel i5+**: 中等（约 5-10 秒）
- **老旧 CPU**: 较慢（约 10-20 秒）

## 切换到付费方案

如果想使用 OpenAI API：

```bash
# backend/.env
USE_MOCK_LLM=False
USE_OPENSOURCE=False  # 改为 False

OPENAI_API_KEY=sk-your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4-turbo-preview
```

## 常见问题

### Q1: Ollama 连接失败

```
ConnectionError: 无法连接到 Ollama
Server disconnected without sending a response.
```

**解决方法 1**：确保 Ollama 正在运行
```bash
ollama serve
```

**解决方法 2**：如果 Ollama 已运行但仍失败，可能是代理问题
- 问题已在代码中修复（使用 `trust_env=False`）
- 如果仍有问题，检查系统代理设置是否影响 localhost 连接

### Q2: faster-whisper 导入失败

```
ImportError: 请安装 faster-whisper
```

**解决**：
```bash
pip install faster-whisper
```

### Q3: edge-tts 生成失败

```
ImportError: 请安装 edge-tts
```

**解决**：
```bash
pip install edge-tts
```

### Q4: 内存不足

**解决**：
1. 使用更小的模型：`qwen2.5:1.5b` 或 `WHISPER_MODEL=tiny`
2. 关闭其他应用
3. 增加 Swap 空间

### Q5: Whisper 首次运行很慢

首次运行时会下载模型，请耐心等待。模型会缓存到：
- macOS/Linux: `~/.cache/huggingface/`
- Windows: `C:\Users\<user>\.cache\huggingface\`

## 性能对比

| 操作 | 开源方案 | 付费方案 |
|-----|---------|---------|
| LLM 响应 | 5-15 秒 | 1-3 秒 |
| ASR 转写 | 3-10 秒 | 1-2 秒 |
| TTS 生成 | 1-3 秒 | 1-2 秒 |
| Vision 分析 | 不支持 | 2-5 秒 |

## 总结

开源方案适合：
- 学习和开发测试
- 对成本敏感的用户
- 对隐私有要求的用户

付费方案适合：
- 需要更快响应速度
- 需要 Vision（图片识别）功能
- 生产环境部署
