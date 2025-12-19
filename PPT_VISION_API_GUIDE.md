# PPT 演讲模块 Vision API 集成指南

## 功能概述

PPT 演讲模块现已集成 GPT-4 Vision API，实现以下核心功能：

1. **视觉识别 PPT 内容** - 识别幻灯片中的文字、图表、图像
2. **对比分析** - 比较用户讲解与 PPT 内容是否匹配、是否流畅
3. **示范教学** - AI 直接示范如何讲解每一页 PPT
4. **PPT 优化建议** - 建议 PPT 内容的增删改

## 完整流程

```
1. 用户上传 PPT → 后端转换为图片
2. 用户录音讲解某一页 → ASR 转为文字
3. Vision API 分析:
   - 读取 PPT 图片
   - 读取用户讲解文字
   - 对比分析
4. AI 返回:
   - 示范教学（直接示范怎么讲）
   - PPT 优化建议（增删改）
5. TTS 生成示范语音 → 用户可以听 AI 怎么讲
```

## API 端点

### 1. 上传 PPT

**端点**: `POST /api/v1/ppt/upload`

**功能**: 上传 PPT/PDF 文件，转换为图片并提取文字

**请求**:
- Content-Type: `multipart/form-data`
- 文件字段: `file`
- 支持格式: PDF, PPT, PPTX
- 最大大小: 50MB

**响应**:
```json
{
  "presentation_id": "uuid-string",
  "total_slides": 10,
  "slides": [
    {
      "slide_number": 1,
      "image_url": "/static/uuid/slide_1.png",
      "text_content": "提取的文字内容..."
    },
    ...
  ]
}
```

### 2. 分析幻灯片讲解（Vision API）

**端点**: `POST /api/v1/ppt/analyze-slide`

**功能**:
- 使用 GPT-4 Vision 分析 PPT 图片
- 对比用户讲解与 PPT 内容
- 给出示范教学和优化建议

**请求体**:
```json
{
  "presentation_id": "uuid-string",
  "slide_number": 1,
  "slide_text": "提取的文字（可选）",
  "transcript": "用户的讲解文字"
}
```

**响应**:
```json
{
  "slide_number": 1,
  "feedback": "**幻灯片内容分析（第 1 页）：**\n我看到这页 PPT 包含...\n\n**你的讲解分析：**\n...\n\n**直接示范 - 这一页你可以这样讲：**\n\"大家请看这一页...\"\n\n**为什么这样讲更好：**\n1. ...\n\n**关于这页 PPT 的优化建议：**\n✅ **保留的内容：**...\n⚠️ **可以改进：**...\n❌ **建议删减：**...",
  "suggestions": [
    "开场明确 - 引导听众注意力",
    "结构清晰 - 用第一、第二、第三",
    "有总结 - 点明意义"
  ],
  "score": 80
}
```

### 3. 生成 AI 示范语音

**端点**: `POST /api/v1/ppt/generate-demo-speech`

**功能**:
- 使用 Vision API 分析 PPT 内容
- 生成示范讲解话术
- 使用 TTS 生成语音
- 返回音频 URL

**请求体**:
```json
{
  "presentation_id": "uuid-string",
  "slide_number": 1,
  "slide_text": "提取的文字",
  "transcript": ""
}
```

**响应**:
```json
{
  "slide_number": 1,
  "demo_script": "大家请看这一页。这里展示的是我们的核心数据...",
  "audio_url": "/static/uuid/demo_slide_1_abc123.mp3"
}
```

## 前端集成示例

### 完整流程代码

```typescript
import {
  uploadPPT,
  analyzeSlide,
  generateDemoSpeech
} from '@/lib/api';

// 1. 上传 PPT
const pptFile = ... // 用户选择的文件
const { presentation_id, slides } = await uploadPPT(pptFile);

// 2. 用户讲解某一页（录音）
const currentSlide = slides[0];
const audioBlob = await recordUserPresentation(); // 假设有录音功能

// 3. 语音转文字（ASR）
const transcript = await transcribeAudio(audioBlob); // 需要实现

// 4. Vision API 分析
const analysis = await analyzeSlide(
  presentation_id,
  currentSlide.slide_number,
  currentSlide.text_content,
  transcript
);

// 5. 显示反馈
console.log('AI 反馈:', analysis.feedback);
console.log('建议:', analysis.suggestions);
console.log('评分:', analysis.score);

// 6. 生成并播放 AI 示范
const demo = await generateDemoSpeech(
  presentation_id,
  currentSlide.slide_number,
  currentSlide.text_content
);

// 播放示范语音
const audio = new Audio(demo.audio_url);
await audio.play();

// 显示示范话术
console.log('示范话术:', demo.demo_script);
```

### 简化版（只分析，不生成语音）

```typescript
// 用户讲解后立即分析
const handleAnalyze = async (userTranscript: string) => {
  const result = await analyzeSlide(
    presentationId,
    currentSlideNumber,
    currentSlideText,
    userTranscript
  );

  // 显示 AI 反馈
  setFeedback(result.feedback);
  setSuggestions(result.suggestions);
  setScore(result.score);
};
```

## API 成本估算

### 一次完整的幻灯片分析（带语音）

**场景**: 用户讲解 1 页 PPT，获得 AI 分析和示范语音

| API | 模型 | 成本 |
|-----|------|------|
| ASR（用户录音转文字） | Whisper | ~$0.006/分钟 |
| Vision（分析 PPT + 对比） | GPT-4 Vision | ~$0.01-0.02/次 |
| TTS（示范语音） | OpenAI TTS | ~$0.015/1000字符 |

**总计**: ~$0.03-0.05/页

### 10 页 PPT 完整演讲练习

- 10 页分析 + 示范: ~$0.30-0.50
- 如果只看文字不听示范语音: ~$0.10-0.20

## Vision API 工作原理

### Mock 模式（开发测试）

```bash
# backend/.env
USE_MOCK_LLM=True
```

- Vision API: 返回示例分析（基于提取的文字）
- 不消耗 API 额度
- 适合前端开发和测试

### 真实模式

```bash
# backend/.env
USE_MOCK_LLM=False
OPENAI_API_KEY=your-api-key
```

**Vision API 调用示例**:

```python
# 后端代码示例
from openai import AsyncOpenAI

# 读取幻灯片图片
with open("slide_1.png", "rb") as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

# 调用 GPT-4 Vision
response = await client.chat.completions.create(
    model="gpt-4o",  # 或 gpt-4-vision-preview
    messages=[
        {
            "role": "system",
            "content": "你是专业的 PPT 演讲教练..."
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "请分析这页 PPT 和用户讲解..."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{image_data}"
                    }
                }
            ]
        }
    ],
    max_tokens=2000
)
```

## 示范教学格式示例

AI 返回的 feedback 采用以下格式：

```markdown
**幻灯片内容分析（第 1 页）：**
我看到这页 PPT 包含标题"项目背景"，以及三个要点：市场需求、竞争分析、机会点。
配有一张市场趋势图表，显示增长曲线。

**你的讲解分析：**
你提到了市场需求和竞争，但在讲解图表时只是简单描述，没有突出关键趋势。
总体来说，覆盖了核心内容，但可以更加流畅和有重点。

**直接示范 - 这一页你可以这样讲：**

"大家请看这一页，我们先来看项目背景。从这张趋势图可以看出，过去三年市场需求
持续上升，年均增长率达到 35%。这说明什么？说明市场机会很大。但同时，我们也
注意到竞争对手在快速增加。所以我们的机会点在哪里？就在于差异化定位和快速响应。
接下来我会详细展开这三个方面。"

**为什么这样讲更好：**
1. **开场明确** - "大家请看这一页"引导注意力
2. **先讲图表** - 视觉元素先吸引，数据支撑观点
3. **用问句** - "这说明什么？"激发思考
4. **结构清晰** - 最后承上启下，引出下一页

**关于这页 PPT 的优化建议：**

✅ **保留的内容：**
- 市场趋势图表：数据清晰，一目了然
- 三个要点：结构合理

⚠️ **可以改进：**
- 标题可以更吸引人，比如"为什么现在是最佳时机？"
- 图表可以标注关键数据点（35% 增长率）
- 竞争分析部分可以添加一张对比表

❌ **建议删减：**
- 如果有大段文字说明，删掉，改为口头讲解
- 不要把所有数据都放在幻灯片上，保留最关键的 2-3 个

---
💡 **练习建议：** 试着用这个结构再讲一遍这一页，记得放慢语速！
```

## 技术实现细节

### 图片处理

1. **PPT 转图片**: 使用 `pdf2image` 或 `python-pptx`
   ```python
   from pdf2image import convert_from_path

   images = convert_from_path('presentation.pdf')
   for i, image in enumerate(images):
       image.save(f'slide_{i+1}.png')
   ```

2. **图片转 Base64**（Vision API 需要）:
   ```python
   import base64

   with open('slide_1.png', 'rb') as f:
       image_data = base64.b64encode(f.read()).decode('utf-8')
   ```

### 文字提取

1. **从 PDF**: 使用 `PyPDF2`
2. **从 PPTX**: 使用 `python-pptx`
3. **从图片（OCR）**: 使用 `pytesseract`（备选）

### 示范话术提取

从 AI 返回的 Markdown 中提取纯文本示范话术：

```python
import re

def extract_demo_script(text: str) -> str:
    # 移除 Markdown 格式
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)

    # 提取引号中的内容
    if '"' in text:
        matches = re.findall(r'"([^"]+)"', text)
        if matches:
            return max(matches, key=len).strip()

    return text
```

## 调试与测试

### 1. 测试 PPT 上传

```bash
curl -X POST http://localhost:8000/api/v1/ppt/upload \
  -F "file=@test.pdf"
```

### 2. 测试 Vision 分析

```bash
curl -X POST http://localhost:8000/api/v1/ppt/analyze-slide \
  -H "Content-Type: application/json" \
  -d '{
    "presentation_id": "uuid-from-upload",
    "slide_number": 1,
    "slide_text": "项目背景",
    "transcript": "这一页讲的是我们项目的背景..."
  }'
```

### 3. 测试示范语音生成

```bash
curl -X POST http://localhost:8000/api/v1/ppt/generate-demo-speech \
  -H "Content-Type: application/json" \
  -d '{
    "presentation_id": "uuid",
    "slide_number": 1,
    "slide_text": "项目背景",
    "transcript": ""
  }'
```

### 4. 播放示范语音

```bash
# 在浏览器中打开
http://localhost:8000/static/uuid/demo_slide_1_abc123.mp3
```

## 常见问题

### Q1: Vision API 能识别什么内容？

A: GPT-4 Vision 可以识别：
- 文字（中英文、各种字体）
- 图表（柱状图、折线图、饼图等）
- 图片和照片
- 布局和排版
- 颜色和设计元素

### Q2: 成本会不会很高？

A: 控制得当的情况下成本很低：
- 每页分析 ~$0.01-0.02
- 10 页 PPT ~$0.10-0.20
- 如果只用于最终评价（而不是每页都分析），成本更低

### Q3: 可以不用 Vision API 吗？

A: 可以，有两种替代方案：
1. **只用 OCR + 文本分析**: 成本更低，但无法识别图表和图片
2. **手动输入 PPT 内容**: 最便宜，但用户体验差

推荐使用 Vision API，体验最好。

### Q4: Mock 模式下能测试所有功能吗？

A: 可以，Mock 模式会返回示例数据：
- 示例分析反馈
- 示例建议列表
- 空音频文件（前端可选择不播放）

## 下一步优化

1. **实时反馈**: 使用 WebSocket 实现边讲边分析
2. **整体评价**: 分析完所有幻灯片后，给出整体演讲评价
3. **视频分析**: 结合 Vision API 分析用户的肢体语言和表情
4. **PPT 自动优化**: AI 自动生成优化后的 PPT 文件

## 需要帮助？

如果遇到问题，请检查：
1. 后端日志 - Vision API 调用是否成功
2. 图片文件是否存在 - 检查 `static` 目录
3. API Key 是否有效 - 检查 `.env` 配置
4. 模型是否支持 Vision - 使用 `gpt-4o` 或 `gpt-4-vision-preview`
