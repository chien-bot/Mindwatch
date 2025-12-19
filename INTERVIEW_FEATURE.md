# 面试场景功能说明

## 功能概述

SpeakMate 新增了 **AI 模拟面试** 功能，用户可以通过语音通话的形式与 AI 面试官进行真实的模拟面试练习。

## 功能流程

### 1. 岗位选择页面 (`/practice/interview`)

**功能：**
- 用户选择要面试的岗位类型
- 提供 6 种常见岗位选项：
  - 前端工程师
  - 后端工程师
  - 产品经理
  - UI/UX 设计师
  - 数据分析师
  - 市场营销

**特点：**
- 每个岗位显示常见面试问题预览
- 选中岗位后显示详细的面试须知
- 现代化深色主题设计，与 PPT 练习页面风格统一

### 2. 语音通话面试页面 (`/practice/interview/call`)

**功能：**
- ✨ **完全沉浸式语音面试体验**（无聊天框，纯语音对话）
- 通过"按住说话"的方式进行语音交互
- AI 面试官会针对所选岗位提出专业问题
- 实时语音识别（ASR）+ 语音合成（TTS）

**通话流程：**
1. **倒计时准备阶段**（5秒）：
   - 显示大号倒计时数字（5→4→3→2→1）
   - 渐变背景动画
   - 提示"面试即将开始"
   - 显示岗位名称和准备提示
2. **连接阶段**：
   - 调用后端开始面试接口
   - 获取 session_id 和第一个问题
3. **通话阶段**：
   - AI 主动开场："请先做个自我介绍"（语音播放）
   - 用户按住麦克风按钮录音回答
   - 松开后自动上传音频 → ASR 转文字
   - 提交给 AI 面试官 → 获取下一个问题
   - AI 语音播放下一个问题
   - 循环 4 轮问答
4. **结束阶段**：
   - AI 语音播放："好的，我的问题就到这里。现在给你总体评价："
   - AI 语音播放完整的总结评价（采用示范教学法）
   - 3秒后自动结束通话

**界面特点：**
- ✨ **纯语音对话模式**：无文字聊天框
- 实时字幕显示（AI 和用户的话）
- AI 说话时显示声波动画
- 用户录音时显示脉冲动画
- 通话计时器
- 按住说话按钮（支持鼠标和触摸）
- ✨ **空格键录音**：按住空格键（Spacebar）即可录音
- 麦克风权限自动请求

### 3. 面试结果分析页面 (`/practice/interview/result`)

**功能：**
- 显示 AI 对用户面试表现的详细分析
- 提供具体的改进建议

**分析内容：**
- **整体评分**：0-100 分制
- **优点分析**：列出表现好的方面
- **需要改进**：指出不足之处
- **具体建议**：
  - 技术深度建议
  - 表达技巧建议
  - 下次练习重点
- **推荐资源**：相关学习资料

## 技术实现

### ✅ 当前状态（已完成）

1. **语音识别（ASR）**：
   - 使用 MediaRecorder API 录制音频（WebM 格式）
   - 后端使用 faster-whisper (tiny 模型) 进行转写
   - 接口：`POST /api/v1/interview/answer/audio`

2. **AI 面试官对话**：
   - 使用 Ollama (qwen2.5:3b 模型)
   - 后端接口：`POST /api/v1/interview/start` 和 `POST /api/v1/interview/answer`
   - 支持多轮对话，自动追踪问题数量

3. **语音合成（TTS）**：
   - 使用 edge-tts (微软免费 TTS)
   - 音色：zh-CN-XiaoxiaoNeural（中文女声）
   - 前端调用：`synthesizeSpeech(text)` 返回音频 URL

4. **会话管理**：
   - 后端内存存储会话（生产环境需改为 Redis）
   - 每个会话包含 session_id、岗位、消息历史、问题计数

### API 接口详情

#### 1. 开始面试

```typescript
// POST /api/v1/interview/start
interface InterviewStartRequest {
  position: string; // 岗位ID (frontend, backend, etc.)
}

interface InterviewStartResponse {
  session_id: string;
  first_question: string; // AI 的第一个问题
  first_question_audio_required: boolean;
}
```

#### 2. 上传音频回答（ASR）

```typescript
// POST /api/v1/interview/answer/audio
// 请求：multipart/form-data
// - file: 音频文件 (Blob)
// - session_id: 会话ID

interface AudioTranscriptionResponse {
  transcript: string; // 转写的文本
  session_id: string;
}
```

**实现位置**：[backend/app/api/v1/interview.py:192-230](backend/app/api/v1/interview.py#L192-L230)

#### 3. 提交文字回答（获取下一题）

```typescript
// POST /api/v1/interview/answer
interface InterviewAnswerRequest {
  session_id: string;
  text_answer: string; // 用户的回答
  conversation_history: Message[];
}

interface InterviewAnswerResponse {
  next_question?: string; // 下一个问题（如果继续）
  is_finished: boolean; // 是否面试结束
  final_feedback?: string; // 最终评价（如果结束）
}
```

#### 4. TTS 语音合成

```typescript
// POST /api/v1/tts
interface TTSRequest {
  text: string;
}

// 响应：返回音频 Base64 编码的 URL
```

### 前端实现关键代码

#### 倒计时准备

```typescript
const [callState, setCallState] = useState<CallState>('countdown');
const [countdown, setCountdown] = useState(5);

useEffect(() => {
  if (callState === 'countdown' && countdown > 0) {
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  } else if (callState === 'countdown' && countdown === 0) {
    initInterview(); // 倒计时结束，开始面试
  }
}, [callState, countdown]);
```

#### 音频录制上传

```typescript
const handleAudioRecorded = async (audioBlob: Blob) => {
  // 1. 上传音频到 ASR 接口
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('session_id', sessionId || '');

  const response = await fetch('/api/v1/interview/answer/audio', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  const userAnswer = data.transcript;

  // 2. 提交给面试 API
  const aiResponse = await submitInterviewAnswer(sessionId, userAnswer);

  // 3. 判断是否结束
  if (aiResponse.is_finished && aiResponse.final_feedback) {
    await speakMessage('好的，我的问题就到这里。现在给你总体评价：', 'ai');
    await speakMessage(aiResponse.final_feedback, 'ai');
  } else if (aiResponse.next_question) {
    await speakMessage(aiResponse.next_question, 'ai');
  }
};
```

#### 语音播放

```typescript
const speakMessage = async (text: string, role: 'user' | 'ai') => {
  setCurrentSpeaking(text);

  // 调用 TTS
  const audioUrl = await synthesizeSpeech(text);
  const audio = new Audio(audioUrl);

  return new Promise<void>((resolve) => {
    audio.onended = () => {
      setCurrentSpeaking('');
      resolve();
    };
    audio.play();
  });
};
```

## 文件结构

```
frontend/src/pages/practice/
├── interview.tsx                    # 岗位选择页面
└── interview/
    ├── call.tsx                     # 语音通话面试页面
    └── result.tsx                   # 面试结果分析页面
```

## 使用流程

1. 用户在产品页 (`/product`) 点击"面试模拟"卡片的 "Try me" 按钮
2. 进入岗位选择页面 (`/practice/interview`)
3. 选择一个岗位，点击"开始语音面试"
4. 进入通话页面 (`/practice/interview/call?position=frontend`)
5. 与 AI 面试官进行语音对话
6. 面试结束后自动跳转到结果页 (`/practice/interview/result`)
7. 查看 AI 分析报告，选择"再练一次"或"返回首页"

## UI/UX 特点

- ✅ 深色主题，与 PPT 练习页面风格统一
- ✅ 渐变色按钮和卡片设计
- ✅ 流畅的动画过渡效果
- ✅ 响应式布局，支持移动端
- ✅ 清晰的视觉反馈（录音状态、AI 说话状态等）
- ✅ 友好的错误提示

## 最新优化（2025-12-17）

### ✅ 已完成优化

1. **5 秒倒计时准备**：
   - 用户进入面试前有 5 秒准备时间
   - 大号数字显示（text-8xl）
   - 渐变背景动画效果
   - 显示岗位名称和提示语

2. **真实音频录制上传**：
   - 替换之前的 `prompt()` 模拟
   - 使用 MediaRecorder API 录制真实音频
   - 自动上传到后端 ASR 接口
   - 返回转写文本后继续面试流程

3. **纯语音对话界面**：
   - 移除聊天框设计
   - 只显示实时字幕
   - 最终评价也通过语音播放
   - 完全模拟真实电话面试体验

4. **后端音频接口**：
   - 新增 `/api/v1/interview/answer/audio` 接口
   - 接收 multipart/form-data (file + session_id)
   - 调用 faster-whisper 转写
   - 返回转写文本给前端

5. **空格键录音支持**（2025-12-17 新增）：
   - 按住空格键（Spacebar）即可录音
   - 松开空格键自动停止录音
   - 与鼠标/触摸按钮同时支持
   - 更适合桌面用户使用

### 技术栈（开源方案）

| 功能 | 技术 | 配置 |
|-----|-----|-----|
| **LLM** | Ollama | qwen2.5:3b (内存占用 ~3-4GB) |
| **ASR** | faster-whisper | tiny 模型 (内存占用 ~200MB) |
| **TTS** | edge-tts | zh-CN-XiaoxiaoNeural（中文女声）|
| **总内存** | - | ~4-5GB（适合 8GB 机器）|

**配置文件** (`backend/.env`):
```bash
USE_MOCK_LLM=False
USE_OPENSOURCE=True
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
WHISPER_MODEL=tiny
EDGE_TTS_VOICE=zh-CN-XiaoxiaoNeural
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001
```

### 性能指标

| 操作 | 耗时 |
|-----|-----|
| 音频上传 | < 1s |
| ASR 转写（tiny 模型）| 3-10s |
| LLM 生成（qwen2.5:3b）| 2-5s |
| TTS 合成（edge-tts）| 1-3s |
| **用户感知总延迟** | 6-18s |

## 后续优化建议

1. **面试录像**：保存面试视频供用户回顾
2. **历史记录**：保存历史面试记录和分析报告
3. **更多岗位**：增加更多职位选项和行业定制问题
4. **难度选择**：提供初级/中级/高级不同难度的面试
5. **实时字幕优化**：添加平滑滚动和高亮效果
6. **会话持久化**：从内存存储改为 Redis
7. **更大 LLM 模型**（如果硬件允许）：
   - qwen2.5:7b 或 qwen2.5:14b
   - 提升 AI 面试官的智能水平

## 测试流程

1. **启动后端**:
```bash
cd backend
uvicorn app.main:app --reload
```

2. **启动前端**:
```bash
cd frontend
npm run dev
```

3. **测试步骤**:
- 访问 http://localhost:3001/practice/interview
- 选择职位（如"前端工程师"）
- 点击"开始语音面试"
- 观察 5 秒倒计时
- 等待 AI 开场白（语音播放）
- 按住按钮录音回答
- 验证多轮对话
- 确认最终评价为语音播放

4. **验证点**:
- ✅ 倒计时显示正确
- ✅ AI 语音播放流畅
- ✅ 音频录制上传成功
- ✅ ASR 转写准确
- ✅ 多轮对话逻辑正确
- ✅ 最终评价为语音形式
- ✅ 无聊天框，纯语音交互
