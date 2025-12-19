# PPT 演讲视频分析功能说明

## 功能概述

用户在录制完 PPT 演讲视频后，可以将视频发送给 AI 进行全面分析。AI 会分析用户的演讲表现、给出具体建议，并示范如何更好地讲解这个 PPT。

## 核心特性

1. **视频上传分析** - 用户录制的演讲视频自动上传到后端进行分析
2. **语音转写** - 使用 faster-whisper 将演讲音频转写为文字
3. **AI 智能分析** - Ollama LLM 根据 PPT 内容和演讲转写进行全面分析
4. **结构化反馈** - 提供评分、优点、改进建议、总体反馈
5. **AI 示范讲解** - AI 生成完整的示范讲解话术，并支持语音播放
6. **可视化展示** - 精美的 UI 展示所有分析结果

## 用户体验流程

```
1. 用户上传 PPT 并开始演讲
   ↓
2. 用户对着摄像头录制自己的演讲视频
   ↓
3. 录制完成后，点击"发送给 AI 分析"按钮
   ↓
4. 页面跳转到分析页面 /practice/ppt-analysis
   ↓
5. 🔥 后端处理流程：
   ┌─────────────────────────────────────┐
   │ 1. 接收视频文件 (WebM 格式)        │
   │ 2. 使用 ffmpeg 提取音频            │
   │ 3. faster-whisper 转写音频为文字   │
   │ 4. 获取 PPT 内容摘要               │
   │ 5. Ollama 分析演讲表现             │
   │ 6. Ollama 生成示范讲解             │
   │ 7. 返回结构化分析结果              │
   └─────────────────────────────────────┘
   ↓
6. 前端展示分析结果：
   ┌──────────────────────────────────────┐
   │ 📊 总体评分：85/100                  │
   │                                      │
   │ 📝 你的演讲转写文本 (可展开)         │
   │                                      │
   │ ✅ 做得好的地方                      │
   │   • 语速适中                         │
   │   • 逻辑清晰                         │
   │   • 表达自信                         │
   │                                      │
   │ 📈 需要改进的地方                    │
   │   • 眼神交流不够                     │
   │   • 缺少手势辅助                     │
   │   • 停顿技巧需改进                   │
   │                                      │
   │ 💬 总体反馈                          │
   │   "你的演讲整体不错..."              │
   │                                      │
   │ 🎯 AI 示范讲解                       │
   │   [🔊 听 AI 示范讲解] 按钮           │
   │   📄 查看示范讲解文本 ▼              │
   │                                      │
   │ 💡 具体建议                          │
   │   1. 建议 1...                       │
   │   2. 建议 2...                       │
   │   3. 建议 3...                       │
   │                                      │
   │ [再练一次] [返回首页]                │
   └──────────────────────────────────────┘
```

## 技术实现

### 后端实现

#### 1. 数据模型 (backend/app/models/ppt.py)

```python
class VideoAnalysisResponse(BaseModel):
    """视频分析响应"""
    presentation_id: str  # PPT 演示文稿 ID
    transcript: str  # 完整转写文本
    overall_score: int  # 总体评分（0-100）
    overall_feedback: str  # 总体反馈
    strengths: List[str]  # 优点列表
    improvements: List[str]  # 需要改进的地方
    demo_script: str  # AI 示范讲解（如何更好地讲解这个 PPT）
    suggestions: List[str]  # 具体建议
```

#### 2. 视频分析接口 (backend/app/api/v1/ppt.py)

**端点**: `POST /api/v1/ppt/analyze-video`

**请求参数**:
- `file`: 上传的视频文件 (multipart/form-data)
- `presentation_id`: PPT 演示文稿 ID (form field)

**处理流程**:

```python
@router.post("/analyze-video", response_model=VideoAnalysisResponse)
async def analyze_presentation_video(
    file: UploadFile = File(...),
    presentation_id: str = Form(...)
):
    # 1. 保存视频文件
    video_content = await file.read()
    video_path = static_dir / f"presentation_{uuid.uuid4().hex[:8]}.webm"

    # 2. 使用 ffmpeg 提取音频
    subprocess.run([
        'ffmpeg',
        '-i', str(video_path),
        '-vn',  # 不要视频流
        '-acodec', 'pcm_s16le',  # PCM 16-bit
        '-ar', '16000',  # 采样率 16kHz
        '-ac', '1',  # 单声道
        str(audio_path)
    ], check=True)

    # 3. 使用 faster-whisper 转写音频
    transcript = await transcribe_audio(audio_content, audio_path.name)

    # 4. 获取 PPT 内容摘要
    ppt_metadata = ppt_metadata_store.get(presentation_id)
    ppt_content_summary = "\n".join([
        f"第 {slide.slide_number} 页：{slide.text_content[:100]}"
        for slide in ppt_metadata.slides
    ])

    # 5. AI 分析演讲表现
    analysis_prompt = f"""你是一位专业的演讲教练。用户刚刚完成了一场 PPT 演讲练习，请分析他的表现。

**PPT 内容摘要：**
{ppt_content_summary}

**用户的讲解转写：**
{transcript}

请从以下几个方面进行分析：
1. **评分**（0-100 分）
2. **优点**（3-5 个做得好的地方）
3. **需要改进**（3-5 个需要改进的地方）
4. **总体反馈**（一段综合性的评价）
5. **具体建议**（3-5 条可执行的改进建议）

请以 JSON 格式返回，格式如下：
{{
  "score": 85,
  "strengths": ["语速适中", "逻辑清晰", "表达自信"],
  "improvements": ["眼神交流不够", "缺少手势辅助"],
  "overall_feedback": "你的演讲整体不错...",
  "suggestions": ["建议 1", "建议 2", "建议 3"]
}}"""

    analysis_result = await call_llm(analysis_prompt)
    analysis_data = json.loads(analysis_result)

    # 6. AI 生成示范讲解
    demo_prompt = f"""你是一位经验丰富的演讲者。现在你要为这个 PPT 做一次完整的示范讲解。

**PPT 内容摘要：**
{ppt_content_summary}

**用户的讲解转写（供参考）：**
{transcript}

请生成一段完整的示范讲解话术（2-3 分钟），要求：
1. 包含清晰的开场白、逐页讲解、总结收尾
2. 语言自然流畅，口语化
3. 使用"大家请看"、"首先"、"接下来"等过渡词
4. 突出 PPT 的核心要点
5. 保持专业且引人入胜

**要求：只输出示范讲解的话术，不要加任何解释或标题。**"""

    demo_script = await call_llm(demo_prompt)

    # 7. 返回分析结果
    return VideoAnalysisResponse(
        presentation_id=presentation_id,
        transcript=transcript,
        overall_score=analysis_data["score"],
        overall_feedback=analysis_data["overall_feedback"],
        strengths=analysis_data["strengths"],
        improvements=analysis_data["improvements"],
        demo_script=demo_script,
        suggestions=analysis_data["suggestions"]
    )
```

### 前端实现

#### 1. 视频存储 (frontend/src/lib/videoStore.ts)

更新 `videoStore.ts` 以存储 `presentationId`：

```typescript
interface TempVideoData {
  blob: Blob;
  presentationId: string;
}

let tempVideoData: TempVideoData | null = null;

export const setTempVideo = (blob: Blob, presentationId?: string) => {
  tempVideoData = {
    blob,
    presentationId: presentationId || '',
  };
};

export const getTempVideoData = (): TempVideoData | null => {
  return tempVideoData;
};
```

#### 2. API 客户端 (frontend/src/lib/api.ts)

```typescript
export interface VideoAnalysisResponse {
  presentation_id: string;
  transcript: string;
  overall_score: number;
  overall_feedback: string;
  strengths: string[];
  improvements: string[];
  demo_script: string;
  suggestions: string[];
}

export async function analyzePresentationVideo(
  videoBlob: Blob,
  presentationId: string
): Promise<VideoAnalysisResponse> {
  const formData = new FormData();
  formData.append('file', videoBlob, 'presentation.webm');
  formData.append('presentation_id', presentationId);

  const response = await fetch(`${API_BASE_URL}/api/v1/ppt/analyze-video`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('视频分析失败');
  }

  const data: VideoAnalysisResponse = await response.json();
  return data;
}
```

#### 3. 分析结果页面 (frontend/src/pages/practice/ppt-analysis.tsx)

主要功能：
- 从 `videoStore` 获取视频 blob 和 presentationId
- 调用 `analyzePresentationVideo` API
- 展示分析结果的各个部分
- 支持播放 AI 示范讲解语音

关键代码片段：

```typescript
export default function PPTAnalysisPage() {
  const [analysisData, setAnalysisData] = useState<VideoAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  useEffect(() => {
    const videoData = getTempVideoData();
    if (videoData && videoData.blob) {
      analyzeVideo(videoData.blob, videoData.presentationId);
    }
  }, []);

  const analyzeVideo = async (videoBlob: Blob, presentationId: string) => {
    try {
      setIsAnalyzing(true);
      const result = await analyzePresentationVideo(videoBlob, presentationId);
      setAnalysisData(result);
      setIsAnalyzing(false);
    } catch (err) {
      setError('分析失败，请稍后重试');
      setIsAnalyzing(false);
    }
  };

  const handlePlayDemo = async () => {
    const audioUrl = await synthesizeSpeech(analysisData.demo_script);
    const audio = new Audio(audioUrl);
    await audio.play();
  };

  // ... 渲染分析结果的 UI
}
```

#### 4. PPT 录制组件更新 (frontend/src/components/PPTPresenter.tsx)

传递 `presentationId` 到 `videoStore`：

```typescript
const handleSendToAI = () => {
  if (recordedBlobRef.current && presentationId) {
    // 保存视频和 presentationId 到临时存储
    setTempVideo(recordedBlobRef.current, presentationId);

    // 跳转到分析页面
    router.push('/practice/ppt-analysis');
  }
};
```

## UI 设计

### 分析页面布局

```
┌──────────────────────────────────────────────────────────────┐
│ [← 返回练习]              AI 分析结果              [头像]    │
├────────────────────┬─────────────────────────────────────────┤
│                    │                                         │
│  🎬 你的演讲录像   │  🤖 AI 智能分析                         │
│                    │                                         │
│  ┌──────────────┐  │  ┌───────────────────────────────────┐ │
│  │              │  │  │ ✅ 分析完成！                     │ │
│  │   [Video]    │  │  └───────────────────────────────────┘ │
│  │              │  │                                         │
│  │              │  │  📊 总体评分：85 / 100                 │
│  └──────────────┘  │  ████████████████░░░░ 85%              │
│                    │                                         │
│                    │  📝 你的演讲转写文本 ▼                 │
│                    │                                         │
│                    │  ✅ 做得好的地方                       │
│                    │    • 语速适中                          │
│                    │    • 逻辑清晰                          │
│                    │                                         │
│                    │  📈 需要改进的地方                     │
│                    │    ↗ 眼神交流不够                     │
│                    │    ↗ 缺少手势辅助                     │
│                    │                                         │
│                    │  💬 总体反馈                           │
│                    │    "你的演讲整体不错..."               │
│                    │                                         │
│                    │  🎯 AI 示范讲解                        │
│                    │    [🔊 听 AI 示范讲解]                │
│                    │    📄 查看示范讲解文本 ▼              │
│                    │                                         │
│                    │  💡 具体建议                           │
│                    │    ① 建议 1...                        │
│                    │    ② 建议 2...                        │
│                    │                                         │
│                    │  [再练一次] [返回首页]                 │
│                    │                                         │
└────────────────────┴─────────────────────────────────────────┘
```

### 颜色方案

| 元素 | 颜色 | 说明 |
|-----|------|-----|
| 总体评分 | 黄色-橙色渐变 | `from-yellow-400 to-orange-400` |
| 优点区域 | 绿色系 | `from-green-900/20 to-emerald-900/20` |
| 改进区域 | 橙色系 | `from-orange-900/20 to-yellow-900/20` |
| 总体反馈 | 蓝色系 | `from-blue-900/20 to-indigo-900/20` |
| AI 示范 | 紫色-粉色渐变 | `from-purple-900/20 to-pink-900/20` |
| 具体建议 | 青色系 | `from-cyan-900/20 to-blue-900/20` |

## 技术栈（开源方案）

| 组件 | 技术 | 说明 |
|-----|-----|-----|
| 视频格式 | WebM | 浏览器录制的默认格式 |
| 音频提取 | ffmpeg | 从视频中提取音频 |
| ASR | faster-whisper (tiny) | 语音转文字 |
| LLM | Ollama qwen2.5:3b | 分析和生成示范 |
| TTS | edge-tts | 语音播放示范 |

**配置文件** (`backend/.env`):
```bash
USE_OPENSOURCE=True
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
EDGE_TTS_VOICE=zh-CN-XiaoxiaoNeural
```

## 性能指标

| 操作 | 开源方案 | 说明 |
|-----|---------|-----|
| 视频上传 | ~1-3s | 取决于视频大小和网络速度 |
| 音频提取 | ~0.5-1s | ffmpeg 处理速度很快 |
| ASR 转写 | 3-8s | faster-whisper (tiny) 处理 1-2 分钟音频 |
| AI 分析 | 5-10s | Ollama qwen2.5:3b 生成分析结果 |
| AI 示范生成 | 5-10s | Ollama qwen2.5:3b 生成示范话术 |
| **总处理时间** | **15-30s** | 对于 1-2 分钟的演讲视频 |
| TTS 合成 | 1-3s | edge-tts 合成速度 |

## 关键文件清单

### 后端
- [backend/app/models/ppt.py](backend/app/models/ppt.py) - 添加 `VideoAnalysisResponse` 模型
- [backend/app/api/v1/ppt.py](backend/app/api/v1/ppt.py) - 新增 `/analyze-video` 接口
- [backend/app/core/llm_client.py](backend/app/core/llm_client.py) - `transcribe_audio` 和 `call_llm` 函数

### 前端
- [frontend/src/lib/videoStore.ts](frontend/src/lib/videoStore.ts) - 更新为存储 `TempVideoData`
- [frontend/src/lib/api.ts](frontend/src/lib/api.ts) - 新增 `analyzePresentationVideo` 函数
- [frontend/src/components/PPTPresenter.tsx](frontend/src/components/PPTPresenter.tsx) - 传递 `presentationId`
- [frontend/src/pages/practice/ppt-analysis.tsx](frontend/src/pages/practice/ppt-analysis.tsx) - 完整重写为真实 API 集成

## 测试流程

### 1. 启动服务

**后端**:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**前端**:
```bash
cd frontend
npm run dev
```

### 2. 测试步骤

1. 访问 http://localhost:3001/practice/ppt
2. 上传一份 PPT 文件（等待解析完成）
3. 点击"开始演讲"按钮
4. 允许摄像头和麦克风权限
5. 点击"开始录制"按钮
6. 对着摄像头讲解 PPT（30秒-2分钟）
7. 点击"停止录制"按钮
8. 点击"发送给 AI 分析"按钮
9. 页面跳转到分析页面
10. 等待 15-30 秒看到分析结果
11. 验证所有分析部分都正确显示
12. 点击"听 AI 示范讲解"按钮测试 TTS
13. 展开查看转写文本和示范讲解文本

### 3. 验证点

- ✅ 视频成功上传
- ✅ 音频成功转写（检查转写文本是否准确）
- ✅ 显示总体评分（0-100）
- ✅ 显示优点列表（至少 3 条）
- ✅ 显示改进建议列表（至少 3 条）
- ✅ 显示总体反馈段落
- ✅ 显示 AI 示范讲解
- ✅ TTS 播放示范讲解成功
- ✅ 显示具体建议列表
- ✅ "再练一次"按钮返回 PPT 页面
- ✅ "返回首页"按钮返回首页

## 常见问题

### Q: 为什么分析时间较长？

A: 分析流程包含多个步骤：
1. 上传视频（1-3s）
2. 提取音频（0.5-1s）
3. ASR 转写（3-8s）
4. AI 分析（5-10s）
5. AI 生成示范（5-10s）

总共需要 15-30 秒左右，取决于视频长度和机器性能。

**优化建议**:
- 升级到更快的模型（如 qwen2.5:7b）
- 使用 GPU 加速 ASR 和 LLM
- 并行执行分析和示范生成

### Q: 转写准确率如何？

A: 准确率取决于：
- **模型**: faster-whisper tiny 模型速度快但准确率中等
- **音频质量**: 清晰的录音转写更准确
- **语速**: 正常语速转写效果最好

**改进方法**:
- 升级到 faster-whisper base 或 small 模型
- 确保录音环境安静，麦克风清晰
- 使用付费 ASR（如 OpenAI Whisper API）

### Q: AI 分析质量如何？

A: 分析质量取决于：
- **模型**: qwen2.5:3b 质量中等，qwen2.5:7b 或 GPT-4 更好
- **Prompt**: 已优化为结构化 JSON 输出
- **PPT 内容**: PPT 内容越详细，分析越准确

**改进方法**:
- 使用更大的模型
- 调整 system prompt 以获得更专业的反馈
- 增加示例（few-shot learning）

### Q: 支持哪些视频格式？

A: 当前支持 WebM 格式（浏览器录制的默认格式）

如果需要支持其他格式（MP4, AVI, MOV），只需修改 ffmpeg 命令即可，ffmpeg 支持几乎所有视频格式。

### Q: 能否保存分析历史？

A: 当前版本不保存历史记录（视频和分析结果会在页面刷新后丢失）

**添加历史记录功能**:
1. 后端添加数据库存储（SQLite 或 PostgreSQL）
2. 保存视频文件、转写文本、分析结果
3. 前端添加"历史记录"页面
4. 用户登录系统（需要用户认证）

## 下一步改进

### 功能增强
- [ ] 添加分析历史记录
- [ ] 支持导出分析报告（PDF）
- [ ] 添加视频时间轴标注（标记关键点）
- [ ] 支持对比分析（对比多次演讲的进步）
- [ ] 添加更多维度的分析（语气、情绪、停顿等）

### 性能优化
- [ ] 并行执行分析和示范生成
- [ ] 使用更快的 ASR 模型或 GPU 加速
- [ ] 视频分块上传（支持大文件）
- [ ] 添加进度条显示详细步骤

### 用户体验
- [ ] 添加分析进度的详细提示
- [ ] 支持中途取消分析
- [ ] 添加"分享分析结果"功能
- [ ] 移动端优化

---

**功能状态**: ✅ 已完成并可测试
**最后更新**: 2025-12-17
