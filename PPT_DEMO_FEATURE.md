# PPT 示范讲解功能说明

## 功能概述

上传 PPT 后，AI 自动为每一页生成示范讲解话术，并支持语音播放，帮助用户学习如何更好地讲解 PPT。

## 核心特性

1. **自动生成示范** - 上传 PPT 后，AI 自动分析每一页内容并生成30-60秒的示范讲解
2. **语音播放示范** - 支持 TTS 语音播放，用户可以听到 AI 如何讲解
3. **查看文字稿** - 可以展开查看完整的示范讲解文本
4. **按页切换** - 可以选择任意一页查看和播放对应的示范

## 用户体验流程

```
1. 用户上传 PPT 文件（PDF/PPT/PPTX）
   ↓
2. 后端解析 PPT 为图片 + 提取文字
   ↓
3. 🔥 AI 自动为每一页生成示范讲解话术
   ┌─────────────────────────────┐
   │ 使用 Ollama (qwen2.5:3b)    │
   │ 根据幻灯片内容生成          │
   │ 30-60秒的口语化讲解话术     │
   └─────────────────────────────┘
   ↓
4. 前端显示 PPT 预览 + AI 示范讲解区域
   ┌──────────────────────────────────┐
   │ 🎯 AI 示范讲解                   │
   │                                  │
   │ [第1页] [第2页] [第3页] ...      │
   │                                  │
   │   [🔊 听 AI 示范讲解] 按钮       │
   │                                  │
   │   📄 查看示范讲解文本 ▼          │
   │   "大家请看第1页..."             │
   └──────────────────────────────────┘
   ↓
5. 用户点击"听 AI 示范讲解"
   ↓
6. 调用 TTS API 生成语音 → 播放
   ↓
7. 用户学习后，点击"开始演讲"进行自己的练习
```

## 技术实现

### 后端变更

#### 1. 数据模型更新

**文件**: [backend/app/models/ppt.py](backend/app/models/ppt.py)

```python
class SlideContent(BaseModel):
    slide_number: int
    image_url: str
    text_content: str
    demo_script: Optional[str] = None  # ✨ 新增：AI 示范讲解话术
```

#### 2. 新增示范生成函数

**文件**: [backend/app/core/llm_client.py](backend/app/core/llm_client.py)

```python
async def generate_slide_demo_script(
    slide_number: int,
    slide_text: str,
    slide_image_path: str = None
) -> str:
    """
    为指定幻灯片生成 AI 示范讲解话术

    不需要用户的录音，直接根据 PPT 内容生成示范讲解
    """
    if settings.USE_OPENSOURCE:
        return await _generate_demo_script_with_ollama(slide_number, slide_text)
    else:
        return await _generate_demo_script_with_gpt4_vision(slide_number, slide_text, slide_image_path)
```

**Ollama 版本**:
```python
async def _generate_demo_script_with_ollama(
    slide_number: int,
    slide_text: str
) -> str:
    system_prompt = """你是一位专业的演讲教练，帮助用户学习如何讲解 PPT。

你的任务：
- 根据幻灯片的文字内容，生成一段30-60秒的示范讲解话术
- 讲解要清晰、有条理、引人入胜
- 使用"大家请看"、"第一"、"第二"等过渡词
- 语言要口语化，像真人在演讲

**要求：只输出示范讲解的话术，不要加任何解释或标题。**"""

    # 调用 Ollama API
    # ...
    return demo_script
```

#### 3. 修改上传接口

**文件**: [backend/app/api/v1/ppt.py](backend/app/api/v1/ppt.py)

```python
@router.post("/upload", response_model=PPTUploadResponse)
async def upload_ppt(file: UploadFile = File(...)):
    # ... 解析 PPT ...

    # ✨ 为每一页生成 AI 示范讲解话术
    logger.info(f"开始为 {len(slides)} 页幻灯片生成示范讲解...")
    for slide in slides:
        try:
            slide_image_path = static_dir / f"slide_{slide.slide_number}.png"

            # 调用 AI 生成示范话术
            demo_script = await generate_slide_demo_script(
                slide_number=slide.slide_number,
                slide_text=slide.text_content,
                slide_image_path=str(slide_image_path) if slide_image_path.exists() else None
            )

            slide.demo_script = demo_script
            logger.info(f"第 {slide.slide_number} 页示范生成完成")

        except Exception as e:
            logger.error(f"第 {slide.slide_number} 页示范生成失败: {str(e)}")
            # 失败时使用简单示范
            slide.demo_script = f"大家好，请看第 {slide.slide_number} 页..."

    return PPTUploadResponse(slides=slides)
```

### 前端变更

#### 1. 类型定义更新

**文件**: [frontend/src/lib/api.ts](frontend/src/lib/api.ts)

```typescript
export interface SlideContent {
  slide_number: number;
  image_url: string;
  text_content: string;
  demo_script?: string; // ✨ 新增
}
```

#### 2. 新增示范讲解组件

**文件**: [frontend/src/components/PPTDemoSection.tsx](frontend/src/components/PPTDemoSection.tsx) (新文件)

```typescript
export default function PPTDemoSection({ slides }: PPTDemoSectionProps) {
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // 播放示范语音
  const handlePlayDemo = async () => {
    const demo_script = slides[selectedSlide].demo_script;
    const audioUrl = await synthesizeSpeech(demo_script);
    const audio = new Audio(audioUrl);
    await audio.play();
  };

  return (
    <div>
      {/* 幻灯片选择器 */}
      {slides.map((slide, index) => (
        <button onClick={() => setSelectedSlide(index)}>
          第 {slide.slide_number} 页
        </button>
      ))}

      {/* 播放按钮 */}
      <button onClick={handlePlayDemo}>
        🔊 听 AI 示范讲解
      </button>

      {/* 示范文本 */}
      <details>
        <summary>📄 查看示范讲解文本</summary>
        <div>{slides[selectedSlide].demo_script}</div>
      </details>
    </div>
  );
}
```

#### 3. 集成到 PPT 页面

**文件**: [frontend/src/pages/practice/ppt.tsx](frontend/src/pages/practice/ppt.tsx)

```tsx
import PPTDemoSection from '@/components/PPTDemoSection';

// 在 PPT 预览页面添加示范讲解区域
<div>
  {/* PPT 预览 */}
  <img src={slides[0].image_url} />

  {/* 操作按钮 */}
  <button onClick={startPresentation}>开始演讲</button>

  {/* 使用提示 */}
  <div>演讲技巧...</div>

  {/* ✨ AI 示范讲解区域 */}
  <PPTDemoSection slides={slides} />
</div>
```

## UI 设计

### 示范讲解区域

```
┌─────────────────────────────────────────┐
│ 🎯 AI 示范讲解                          │
│                                         │
│ AI 已经为每一页 PPT 生成了示范讲解话术  │
│ 你可以先听听AI是怎么讲的！              │
│                                         │
│ [第1页] [第2页] [第3页] [第4页]         │
│   ^^^^^                                 │
│  (选中状态：蓝紫渐变背景)               │
│                                         │
│        ┌─────────────────────┐          │
│        │ 🔊 听 AI 示范讲解   │          │
│        └─────────────────────┘          │
│         (蓝紫渐变按钮)                  │
│                                         │
│ ▼ 📄 查看示范讲解文本                   │
│   ┌─────────────────────────────────┐  │
│   │ "大家请看第1页。这页展示了我们  │  │
│   │  的核心数据。从图表中可以看出   │  │
│   │  ..."                             │  │
│   └─────────────────────────────────┘  │
│                                         │
│ 💡 建议：先听 AI 的示范讲解，学习如何 │
│    组织语言和表达节奏...                │
└─────────────────────────────────────────┘
```

### 按钮状态

- **未播放**: 蓝紫渐变按钮 "🔊 听 AI 示范讲解"
- **播放中**: 灰色按钮 "播放中..." + 脉冲动画
- **播放完成**: 恢复蓝紫渐变按钮

## 示范讲解示例

### 输入（幻灯片文字内容）
```
项目介绍
本次演讲将介绍我们的新产品设计方案
```

### 输出（AI 生成的示范讲解）
```
大家好，请看第1页。今天我要为大家介绍我们团队最新的产品设计方案。

这个项目是我们经过三个月的市场调研和用户访谈后，精心打造的解决方案。
它主要解决了用户在使用传统产品时遇到的三个核心痛点。

接下来，我将从市场背景、产品特点和实施计划三个方面，为大家详细讲解。
```

## 技术栈（开源方案）

| 组件 | 技术 | 说明 |
|-----|-----|-----|
| LLM | Ollama qwen2.5:3b | 生成示范讲解话术 |
| TTS | edge-tts | 语音播放示范 |
| 内存占用 | ~3-4GB | 适合 8GB 机器 |

**配置文件** (`backend/.env`):
```bash
USE_OPENSOURCE=True
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
EDGE_TTS_VOICE=zh-CN-XiaoxiaoNeural
```

## 性能指标

| 操作 | 开源方案 | 付费方案 |
|-----|---------|---------|
| 上传 PPT | ~2-5s | ~2-5s |
| 生成示范（每页）| 2-5s | 1-2s |
| **总上传时间（10页）**| ~30-60s | ~15-30s |
| TTS 合成 | 1-3s | 1-2s |

**优化建议**: 可以并发生成多页示范话术，减少总时间

## 关键文件清单

### 后端
- `backend/app/models/ppt.py` - 添加 `demo_script` 字段
- `backend/app/core/llm_client.py` - 新增 `generate_slide_demo_script()` 函数
- `backend/app/api/v1/ppt.py` - 上传接口集成示范生成

### 前端
- `frontend/src/lib/api.ts` - 类型定义添加 `demo_script`
- `frontend/src/components/PPTDemoSection.tsx` - 新增示范讲解组件
- `frontend/src/pages/practice/ppt.tsx` - 集成示范讲解区域

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
- 访问 http://localhost:3001/practice/ppt
- 上传一份 PPT 文件
- 等待解析完成（后端会自动生成示范讲解）
- 在"AI 示范讲解"区域点击不同页码
- 点击"听 AI 示范讲解"按钮
- 验证语音播放
- 展开查看示范文本

4. **验证点**:
- ✅ PPT 上传成功
- ✅ 每一页都生成了示范讲解
- ✅ 切换页码显示对应示范
- ✅ 点击播放按钮播放语音
- ✅ 示范文本可以展开查看

## 常见问题

### Q: 为什么有些页面示范生成失败？

A: 可能原因：
1. Ollama 服务未启动或连接超时
2. 幻灯片内容为空（只有图片无文字）
3. LLM 生成超时

解决方案：
- 检查 Ollama 服务: `ollama serve`
- 失败时会使用简单的默认示范

### Q: 示范讲解的质量如何？

A: 质量取决于：
- **模型**: qwen2.5:3b 质量中等，qwen2.5:7b 或 GPT-4 质量更高
- **PPT 内容**: 文字越详细，示范越准确
- **Prompt 设计**: 已优化为生成30-60秒口语化演讲稿

### Q: 能否自定义示范风格？

A: 可以修改 `_generate_demo_script_with_ollama()` 中的 `system_prompt`：
```python
system_prompt = """你是一位幽默风趣的演讲教练...  # 修改风格
```

### Q: 支持哪些语言？

A: 当前只支持中文，可以通过修改 prompt 支持其他语言

---

**功能状态**: ✅ 已完成并可测试
**最后更新**: 2025-12-17
