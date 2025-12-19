# AI 示范教学功能说明

## 功能概述

用户录音自我介绍后，AI 不仅会分析评价，还会：
1. **生成优化后的示范版本**（基于用户的真实信息）
2. **用语音朗读示范**，让用户听到正确的表达方式
3. **提供文字对比**，用户可以查看示范文本

## 用户体验流程

```
1. 用户点击"开始录音"
   ↓
2. 用户说出自我介绍
   ↓
3. 用户点击"停止录音"
   ↓
4. 系统转写音频为文字
   ↓
5. AI 分析并生成：
   - 诊断分析
   - 改进建议
   - 示范版本（基于用户信息优化）
   ↓
6. 显示在聊天界面：
   - 用户的原始文本
   - AI 的完整反馈（分析+建议）
   - 🎯 AI 示范区域（带播放按钮）
   ↓
7. 用户点击"听示范"按钮
   ↓
8. AI 用流畅的语音朗读示范版本
   ↓
9. 用户可以展开查看示范文本
```

## 技术实现

### 后端变更

#### 1. 数据模型更新 ([audio.py](backend/app/models/audio.py))

```python
class AudioTranscriptionResponse(BaseModel):
    transcript: str  # 用户说的话
    reply: str       # AI 的分析和建议
    demo_text: str   # AI 生成的示范文本 ✨ 新增
    mode: str
```

#### 2. API 逻辑更新 ([self_intro_audio.py](backend/app/api/v1/self_intro_audio.py))

**核心函数：**
- `get_self_intro_feedback()`: 返回 `(reply, demo_text)` 元组
- `extract_demo_text()`: 从 AI 响应中智能提取示范文本

**提取策略：**
1. 优先匹配引号内的文本（双引号、中文引号）
2. 查找"你可以这样说："后的段落
3. 返回最长的有效匹配（≥20字符）

#### 3. Prompt 设计 ([system_prompts.py](backend/app/prompts/system_prompts.py))

系统 Prompt 已经设计为"示范教学法"：
- ❌ 不说 "你应该加入更多细节"
- ✅ 直接给出 "你可以这样说：【完整示范】"

#### 4. TTS 集成

- 接口：`POST /api/v1/tts`
- 功能：将示范文本转为 MP3 音频
- 开源方案：使用 edge-tts（微软免费 TTS）
- 音色：`zh-CN-XiaoxiaoNeural`（中文女声）

### 前端变更

#### 1. 类型定义 ([chat.ts](frontend/src/types/chat.ts))

```typescript
export interface Message {
  role: MessageRole;
  content: string;
  demoText?: string;  // ✨ 新增
}
```

#### 2. API 封装 ([api.ts](frontend/src/lib/api.ts))

```typescript
// 上传音频返回类型添加 demo_text
uploadSelfIntroAudio(): Promise<{
  transcript: string;
  reply: string;
  demo_text: string;  // ✨ 新增
  mode: string;
}>

// TTS API（已存在）
synthesizeSpeech(text: string): Promise<string>
```

#### 3. 组件更新

**SelfIntroLivePanel.tsx**
- 接收 `demo_text` 并传递给父组件

**ChatWindow.tsx**
- `handleTranscriptReceived()` 接收 `demoText` 参数
- 将 `demoText` 添加到 AI 消息中

**MessageList.tsx** ✨ 核心变更
- 在 AI 消息下方显示"AI 示范"区域
- 添加"听示范"按钮
- 点击按钮调用 TTS API 生成语音
- 支持播放/停止控制
- 可展开查看示范文本

## UI 设计

### AI 消息气泡布局

```
┌─────────────────────────────────────┐
│ [AI 头像] AI 教练                   │
├─────────────────────────────────────┤
│                                     │
│ **快速诊断：**                      │
│ 你的自我介绍...                     │
│                                     │
│ **改进建议：**                      │
│ 1. ...                              │
│ 2. ...                              │
│                                     │
├─────────────────────────────────────┤
│ 🎯 AI 示范        [🔊 听示范] 按钮  │
│                                     │
│ ▼ 查看示范文本                      │
│   ┌─────────────────────────────┐  │
│   │ "大家好，我是张三..."       │  │
│   └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 按钮状态

- **未播放**: 蓝色按钮 "🔊 听示范"
- **播放中**: 灰色按钮 "⏸ 播放中..." + 脉冲动画
- **播放完成**: 恢复蓝色按钮

## 测试结果

### 后端测试 (test_demo_feature.py)

```bash
$ python backend/test_demo_feature.py

✅ LLM 调用成功
✅ 成功提取示范文本 (230 字符)
✅ 提取逻辑测试通过
```

**测试用例：**
- 用户输入："大家好，我叫张三，我是一名程序员。"
- AI 生成了完整的示范版本（230字符）
- 成功提取并返回

### 集成测试

1. **语音识别**: faster-whisper (tiny) ✅
2. **LLM 生成**: Ollama qwen2.5:3b ✅
3. **示范提取**: 正则匹配 ✅
4. **语音合成**: edge-tts ✅

## 使用示例

### 用户说
> "大家好，我叫张三，我是一名程序员。"

### AI 回复
```
**快速诊断：**
你的自我介绍基本涵盖了基本信息，但显得较为平淡。

**直接示范 - 你可以这样说：**

"大家好，我叫张三，作为一名程序员，我专注于后端开发领域。
在过去五年中，我在一家知名科技公司担任核心工程师的角色，
负责构建和维护公司的大型数据库系统..."

**为什么这样说更好：**
1. 强调具体领域 - 明确指出"后端开发"而非泛指"程序员"
2. 加入具体事例 - 描述一个成功项目的细节
3. 展示热情和学习态度 - 提到参与开源社区和分享技术文章
```

### UI 显示
- ✅ 文字反馈完整显示
- ✅ 示范文本正确提取
- ✅ "听示范"按钮可点击
- ✅ 点击后播放 AI 语音
- ✅ 可展开查看完整文本

## 关键文件清单

### 后端
- `backend/app/models/audio.py` - 添加 demo_text 字段
- `backend/app/api/v1/self_intro_audio.py` - 提取示范文本逻辑
- `backend/app/prompts/system_prompts.py` - 示范教学 prompt
- `backend/app/api/v1/tts.py` - TTS 接口（已存在）
- `backend/app/core/llm_client.py` - LLM + TTS 集成

### 前端
- `frontend/src/types/chat.ts` - 添加 demoText 字段
- `frontend/src/lib/api.ts` - API 类型定义
- `frontend/src/components/SelfIntroLivePanel.tsx` - 传递 demo_text
- `frontend/src/components/ChatWindow.tsx` - 处理 demo_text
- `frontend/src/components/MessageList.tsx` - 显示播放按钮

### 测试
- `backend/test_demo_feature.py` - 功能测试脚本

## 配置要求

### 开源方案（当前配置）

```bash
# .env
USE_MOCK_LLM=False
USE_OPENSOURCE=True
OLLAMA_MODEL=qwen2.5:3b
WHISPER_MODEL=tiny
EDGE_TTS_VOICE=zh-CN-XiaoxiaoNeural
```

**服务依赖：**
- Ollama 服务运行在 `localhost:11434`
- qwen2.5:3b 模型已下载

**内存占用：**
- LLM: ~3-4GB
- ASR: ~200MB
- TTS: ~50MB
- **总计**: ~4-5GB

### 付费方案（可选）

```bash
# .env
USE_OPENSOURCE=False
OPENAI_API_KEY=sk-xxx
```

## 性能指标

| 操作 | 开源方案 | 付费方案 |
|-----|---------|---------|
| 语音识别 | 3-10秒 | 1-3秒 |
| LLM 生成 | 2-5秒 | 1-2秒 |
| 语音合成 | 1-3秒 | 1-2秒 |
| **总计** | 6-18秒 | 3-7秒 |

## 后续优化建议

1. **提取精度优化**
   - 使用 LLM 的结构化输出（JSON mode）
   - 确保示范文本 100% 准确提取

2. **音频缓存**
   - 缓存已生成的示范音频
   - 避免重复调用 TTS API

3. **多场景支持**
   - 面试场景也添加示范功能
   - PPT 演讲场景添加示范

4. **交互优化**
   - 添加音频波形可视化
   - 支持暂停/继续播放
   - 添加播放进度条

## 常见问题

### Q: 为什么有时提取不到示范文本？
A: AI 可能没有按照 prompt 格式生成。解决方案：
- 优化 prompt，更明确地要求使用引号
- 改用结构化输出（JSON mode）

### Q: 语音播放失败怎么办？
A: 检查：
1. edge-tts 是否正确安装
2. 网络连接是否正常（edge-tts 需要联网）
3. 浏览器是否支持音频播放

### Q: 可以切换语音音色吗？
A: 可以，修改 `.env` 中的 `EDGE_TTS_VOICE`：
- `zh-CN-XiaoxiaoNeural` - 女声（当前）
- `zh-CN-YunxiNeural` - 男声
- `zh-CN-YunyangNeural` - 男声（新闻播音）

---

**功能状态**: ✅ 已完成并测试通过
**最后更新**: 2025-12-16
