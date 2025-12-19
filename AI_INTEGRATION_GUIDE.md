# AI API 集成指南

本指南说明如何将真实的 AI API 集成到 SpeakMate 应用中。

## 当前状态

- ✅ 后端代码已完成 AI API 集成
- ✅ 语音转文字 (ASR) 已集成 Whisper API
- ✅ 文字转语音 (TTS) 已集成 OpenAI TTS API
- ✅ OpenAI SDK 已安装 (openai>=1.13.3)
- ✅ 系统 Prompt 已优化为"示范教学法"
- ⏳ 需要配置 API Key 才能使用完整功能

## 快速开始

### 1. 获取 OpenAI API Key

**选项 A: 使用 OpenAI 官方 API**
- 访问 [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- 创建新的 API Key
- 复制 API Key (格式: `sk-...`)

**选项 B: 使用兼容的第三方 API**
- 国内用户可以使用 OpenAI 兼容的服务商，如:
  - [DeepSeek](https://platform.deepseek.com/) - 性价比高
  - [阿里云百炼](https://bailian.console.aliyun.com/)
  - [智谱 AI](https://open.bigmodel.cn/)
  - 其他支持 OpenAI API 格式的服务

### 2. 配置环境变量

编辑 `/backend/.env` 文件:

```bash
# LLM 配置
USE_MOCK_LLM=False  # 改为 False 以使用真实 AI

# OpenAI API 配置
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4-turbo-preview

# 如果使用第三方服务，修改 BASE_URL 和 MODEL
# 例如使用 DeepSeek:
# OPENAI_BASE_URL=https://api.deepseek.com
# OPENAI_MODEL=deepseek-chat
```

### 3. 重启后端服务

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. 测试功能

1. 访问前端应用 (http://localhost:3000)
2. 进入"自我介绍练习"模式
3. 录制一段自我介绍（真实语音）
4. 系统会自动：
   - 使用 Whisper API 将语音转为文字
   - 使用 GPT 分析并给出"示范教学法"反馈

## 示范教学法说明

我们已经优化了 AI 的教学方式，从"给建议"改为"直接示范"：

### ❌ 旧方式（建议式）
```
**改进建议:**
1. 你应该加入更多工作经验
2. 开头可以更有吸引力
3. 可以用数据支撑你的成果
```

### ✅ 新方式（示范式）
```
**快速诊断：**
你的自我介绍包含了基本信息，但表达比较平淡，缺少具体事例。

**直接示范 - 你可以这样说：**

"大家好，我叫张三，有 3 年前端开发经验。在上一家公司，我主导开发了用户中心重构项目，将页面加载速度提升了 60%，用户留存率提高了 15%。我熟悉 React、Vue 全家桶，也有 Node.js 后端经验。业余时间我喜欢研究性能优化，在团队内部做过多次技术分享。很高兴认识大家！"

**为什么这样说更好：**
1. **有具体成果** - "提升 60%" 比 "做过优化" 更有说服力
2. **突出价值** - 强调给公司带来的实际收益
3. **技能清晰** - 明确列出技术栈，便于评估
4. **展示软实力** - 技术分享体现学习能力和团队贡献

💡 **练习建议：** 试着用这个结构再说一遍，记得加入你自己的具体数据和案例！
```

## AI 模型选择建议

### 推荐模型

| 模型 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **GPT-4 Turbo** | 理解能力强，输出质量高 | 成本较高 | 生产环境 |
| **GPT-3.5 Turbo** | 成本低，响应快 | 理解复杂指令稍弱 | 开发测试 |
| **DeepSeek Chat** | 性价比极高，中文友好 | 需要更详细的 prompt | 中文用户 |
| **Claude 3.5 Sonnet** | 长文本处理好，安全性高 | 需要 Anthropic API | 企业用户 |

### 成本参考 (仅供参考)

- GPT-4 Turbo: ~$0.01-0.03/次反馈
- GPT-3.5 Turbo: ~$0.001-0.003/次反馈
- DeepSeek: ~$0.0001-0.0003/次反馈

## 故障排查

### 问题 1: API Key 无效
```
Error: Invalid API key
```
**解决方案:**
- 检查 API Key 是否正确复制（不要有多余空格）
- 确认 API Key 是否已激活
- 验证账户余额是否充足

### 问题 2: 连接超时
```
Error: Connection timeout
```
**解决方案:**
- 检查网络连接
- 如果在国内，尝试使用代理或国内服务商
- 增加超时时间（在 llm_client.py 中修改）

### 问题 3: 模型不存在
```
Error: Model not found
```
**解决方案:**
- 检查 OPENAI_MODEL 配置是否正确
- 确认所选服务商支持该模型
- 查看服务商文档确认正确的模型名称

## 进一步优化

### 1. 添加重试逻辑

在 `llm_client.py` 中添加自动重试:

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
async def _call_real_llm(self, messages: List[Message]) -> str:
    # ... 现有代码
```

### 2. 添加缓存机制

对于相似的输入，可以缓存 AI 响应以节省成本:

```python
from functools import lru_cache

# 添加简单的内存缓存
# 生产环境建议使用 Redis
```

### 3. 添加使用统计

记录 API 调用次数和成本:

```python
# 在 llm_client.py 中添加
import logging

logger = logging.getLogger(__name__)

# 在每次调用后记录
logger.info(f"LLM call completed. Tokens used: {response.usage.total_tokens}")
```

## API 使用说明

### 完整流程

当 `USE_MOCK_LLM=False` 时，自我介绍功能会调用三个 OpenAI API：

1. **Whisper API (语音转文字 ASR)**
   - 模型: `whisper-1`
   - 输入: 用户录制的音频文件
   - 输出: 转写的文字
   - 成本: ~$0.006/分钟

2. **GPT API (AI 分析)**
   - 模型: `gpt-4-turbo-preview` (可配置)
   - 输入: 转写的文字 + 系统 Prompt
   - 输出: AI 示范教学反馈（文字）
   - 成本: ~$0.01-0.03/次

3. **TTS API (文字转语音)**
   - 模型: `tts-1` 或 `tts-1-hd`
   - 音色: `nova` (可选: alloy, echo, fable, onyx, nova, shimmer)
   - 输入: AI 反馈文字
   - 输出: 语音文件 (MP3)
   - 成本: ~$0.015/1000字符

**完整流程:**
```
用户说话 → Whisper API → 文字 → GPT API → 反馈文字 → TTS API → 反馈语音
```

**总成本估算:**
- 一次完整练习（1-2 分钟语音 + AI 反馈）: ~$0.03-0.06
- 如果只看文字不听语音，省略 TTS: ~$0.02-0.04

### 支持的音频格式

Whisper API 支持以下格式：
- `webm` (浏览器录制默认格式)
- `mp3`
- `mp4`
- `m4a`
- `wav`
- `flac`

最大文件大小: 25 MB

## TTS 使用说明

### 后端 API

**端点:** `POST /api/v1/tts`

**请求体:**
```json
{
  "text": "要转换为语音的文字"
}
```

**响应:** 音频文件（MP3 格式）

### 前端调用示例

```typescript
import { synthesizeSpeech } from '@/lib/api';

// 将 AI 反馈转为语音
const audioUrl = await synthesizeSpeech(aiReply);

// 播放语音
const audio = new Audio(audioUrl);
await audio.play();

// 用完后释放 URL
URL.revokeObjectURL(audioUrl);
```

### 音色选择

OpenAI TTS 提供 6 种音色，可在 [llm_client.py:229](backend/app/core/llm_client.py#L229) 修改：

- `alloy` - 中性、平衡
- `echo` - 男性、沉稳
- `fable` - 英式口音
- `onyx` - 男性、深沉
- `nova` - 女性、友好（**当前默认**）
- `shimmer` - 女性、温暖

## 下一步

1. ✅ 自我介绍功能已支持 AI
2. ✅ 语音识别 (ASR) 已集成
3. ✅ 语音合成 (TTS) 已集成
4. ⏳ 前端添加"播放示范"按钮
5. ⏳ 接下来可以集成到面试场景（AI 面试官语音对话）
6. ⏳ 接下来可以集成到 PPT 演讲场景

## 需要帮助？

如果遇到问题，请检查:
1. 后端日志输出
2. 浏览器控制台错误
3. API 服务商的使用文档
