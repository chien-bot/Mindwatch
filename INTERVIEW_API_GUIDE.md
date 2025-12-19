# AI 面试功能 API 使用指南

## 功能概述

AI 面试功能支持真实的多轮语音对话，流程如下：

```
1. 开始面试 → AI 提出第一个问题（文字）
2. 用户回答 → 提交文字回答
3. AI 分析 → 生成下一个问题或追问
4. 重复 2-3（共 4-5 轮）
5. 面试结束 → AI 给出"示范教学"总评
```

## API 端点

### 1. 开始面试

**端点**: `POST /api/v1/interview/start`

**请求体**:
```json
{
  "position": "frontend"  // 岗位ID: frontend, backend, product, designer, data, marketing
}
```

**响应**:
```json
{
  "session_id": "uuid-string",
  "first_question": "请先做个简单的自我介绍",
  "first_question_audio_required": true
}
```

### 2. 提交回答

**端点**: `POST /api/v1/interview/answer`

**请求体**:
```json
{
  "session_id": "uuid-string",
  "text_answer": "用户的文字回答",
  "conversation_history": []  // 可选，后端会自动管理
}
```

**响应（继续面试）**:
```json
{
  "next_question": "你最近做过什么有挑战性的项目？",
  "is_finished": false
}
```

**响应（面试结束）**:
```json
{
  "is_finished": true,
  "final_feedback": "**总体表现：**\n你的回答基本涵盖了主要内容...\n\n**需要改进的地方：**\n1. **自我介绍缺少亮点**\n   你可以这样说：'您好，我是张三...'[完整示范]\n..."
}
```

## 完整流程示例

### 前端调用示例

```typescript
import { startInterview, submitInterviewAnswer, synthesizeSpeech } from '@/lib/api';

// 1. 开始面试
const { session_id, first_question } = await startInterview('frontend');

// 2. 播放 AI 的问题（TTS）
const audioUrl = await synthesizeSpeech(first_question);
const audio = new Audio(audioUrl);
await audio.play();

// 3. 用户回答（这里用文字，实际可以录音+ASR）
const userAnswer = "大家好，我叫张三...";

// 4. 提交回答，获取下一个问题
const response = await submitInterviewAnswer(session_id, userAnswer);

if (response.is_finished) {
  // 面试结束
  console.log('最终评价:', response.final_feedback);

  // 可选：播放总评
  const feedbackAudio = await synthesizeSpeech(response.final_feedback);
  // ...
} else {
  // 继续下一轮
  console.log('下一个问题:', response.next_question);
  // 播放问题 → 录音 → 提交...
}
```

## 集成 ASR + TTS 的完整流程

### Mock 模式（当前）

```bash
# backend/.env
USE_MOCK_LLM=True
```

- LLM: 返回 mock 问题和评价
- ASR: 前端直接输入文字（无需语音）
- TTS: 前端可选择性调用（Mock 模式下返回空音频）

### 真实模式

```bash
# backend/.env
USE_MOCK_LLM=False
OPENAI_API_KEY=your-api-key
```

#### 完整对话流程

```typescript
// 1. 开始面试
const { session_id, first_question } = await startInterview('frontend');

// 2. AI 说话 (TTS)
const questionAudio = await synthesizeSpeech(first_question);
await new Audio(questionAudio).play();

// 3. 用户录音
const audioBlob = await recordUserAudio();  // 假设有录音功能

// 4. 语音转文字 (ASR)
const userAnswer = await transcribeAudioBlob(audioBlob);  // 需要实现

// 5. 提交回答
const response = await submitInterviewAnswer(session_id, userAnswer);

// 6. 继续循环 2-5，直到 is_finished = true
```

## 示范教学格式

面试结束后，AI 会给出"示范教学"风格的总评：

```markdown
**总体表现：**
你的回答基本涵盖了主要内容，但在具体性和结构化方面还有提升空间。

**需要改进的地方：**

1. **自我介绍缺少亮点**
   你可以这样说：
   "您好，我是张三，有 3 年前端开发经验。在上一家公司，我主导了用户中心重构项目，
   将页面加载速度提升了 60%，用户留存率提高了 15%。我熟悉 React、Vue 全家桶，
   也有 Node.js 后端经验。很高兴有机会面试贵公司的前端岗位。"

   **为什么这样更好：**
   - 开场简洁，直奔主题
   - 用数据说话（60%、15%）
   - 技能清晰列出

2. **项目经历描述不够具体**
   你可以这样说：
   "在电商平台项目中，我负责商品详情页的开发。当时面临的最大挑战是页面性能问题，
   初始加载需要 8 秒。我采用了图片懒加载、代码分割和 CDN 加速等方案，
   最终将加载时间降到 2 秒以内，转化率提升了 25%。"

   **为什么这样更好：**
   - STAR 法则（情境-任务-行动-结果）
   - 量化成果（8秒 → 2秒，+25%）
   - 展示问题解决能力

**总体建议：**
1. 准备 2-3 个具体项目案例，记住关键数据
2. 回答时采用"总-分-总"结构
3. 突出你的独特贡献和成果
```

## 成本估算

### 一次完整面试（4-5 轮对话）

**使用文字（无语音）**:
- LLM 调用: 5-6 次（问题 + 最终评价）
- 成本: ~$0.05-0.15

**使用语音（完整体验）**:
- ASR: 4-5 次用户回答（每次 30-60 秒）= ~$0.02-0.05
- LLM: 5-6 次 = ~$0.05-0.15
- TTS: 5-6 次 AI 说话（每次 50-100 字）= ~$0.01-0.02
- **总计**: ~$0.08-0.22/次完整面试

## 后续优化

### 1. 添加真实语音输入

需要修改前端录音和提交逻辑：

```typescript
// 录音并转为 Base64
const audioBlob = await recordAudio();
const base64Audio = await blobToBase64(audioBlob);

// 提交音频回答
await fetch('/api/v1/interview/answer', {
  method: 'POST',
  body: JSON.stringify({
    session_id,
    audio_data: base64Audio  // 后端会调用 ASR
  })
});
```

后端需要解析 Base64 → bytes → ASR。

### 2. 流式对话（实时）

使用 WebSocket 实现实时语音对话，类似真实电话面试。

### 3. 会话持久化

当前会话存在内存中，重启丢失。生产环境应该用 Redis 或数据库。

## 调试

### 查看会话信息

```bash
GET /api/v1/interview/session/{session_id}
```

返回当前会话状态（问题数、消息数等）

### 测试流程

1. 启动后端: `cd backend && uvicorn app.main:app --reload`
2. 访问文档: http://localhost:8000/docs
3. 测试 `/api/v1/interview/start`
4. 复制 session_id，测试 `/api/v1/interview/answer`
5. 重复 3-4 轮，查看最终评价

## 前端集成说明

面试页面 ([call.tsx](frontend/src/pages/practice/interview/call.tsx)) 需要：

1. 调用 `startInterview()` 获取第一个问题
2. 播放问题（TTS）
3. 录音或输入回答
4. 调用 `submitInterviewAnswer()` 提交
5. 重复 2-4
6. 显示最终评价（可播放语音）

详见前端代码示例。
