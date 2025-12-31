# SpeakMate - AI 口语教练平台

## 项目文档 (Project Documentation)

---

# 第一部分：应用介绍

## 1. 灵感来源与解决的问题

### 灵感来源

在当今全球化的职场环境中，口语表达能力已成为职业发展的关键技能。然而，我们观察到以下痛点：

1. **练习机会有限**：大多数人缺乏安全、无压力的环境来练习口语表达
2. **反馈缺失**：自我练习时无法获得专业、即时的反馈
3. **场景单一**：传统语言学习软件缺乏针对职场场景的专项训练
4. **成本高昂**：聘请专业口语教练费用昂贵，普通人难以承受

### 解决的问题

SpeakMate 致力于解决以下核心问题：

| 问题 | SpeakMate 解决方案 |
|------|-------------------|
| 无练习机会 | 24/7 全天候 AI 陪练，随时随地练习 |
| 缺乏反馈 | AI 实时分析，提供个性化改进建议 |
| 场景单一 | 提供自我介绍、面试模拟、PPT 演讲三大职场场景 |
| 成本高昂 | 免费使用，降低口语提升门槛 |

---

## 2. 目标用户画像

### 主要用户群体

#### 用户群体 A：求职者
- **年龄**：20-30 岁
- **特征**：即将毕业或正在求职的学生、职场新人
- **痛点**：面试紧张、自我介绍不流畅、缺乏面试经验
- **需求**：模拟面试练习、面试技巧提升

#### 用户群体 B：职场人士
- **年龄**：25-45 岁
- **特征**：需要进行汇报、演讲的职场人员
- **痛点**：PPT 演讲紧张、表达不清晰、缺乏练习机会
- **需求**：演讲技巧提升、PPT 讲解能力训练

#### 用户群体 C：语言学习者
- **年龄**：18-50 岁
- **特征**：希望提升中文/英文口语表达能力的学习者
- **痛点**：缺乏语言环境、没有对话练习伙伴
- **需求**：口语练习、发音纠正、表达能力提升

---

## 3. 核心功能列表

### 功能模块一：自我介绍练习
- 录制自我介绍音频
- AI 实时语音转文字 (ASR)
- AI 分析表达内容、结构、流畅度
- 生成 AI 示范讲解（文本 + 语音）
- 提供个性化改进建议

### 功能模块二：AI 面试模拟
- 选择面试岗位（前端、后端、产品、设计等）
- AI 面试官实时语音对话
- 根据岗位智能提问
- 面试结束后生成详细分析报告
- 评估沟通能力、专业知识、逻辑思维

### 功能模块三：PPT 演讲练习
- 支持上传 PPT/PDF 文件
- AI 自动解析 PPT 内容
- 为每页生成 AI 示范讲解话术
- 录制带画中画的演讲视频（PPT + 摄像头）
- AI 分析演讲表现，给出评分和建议
- 语音播放 AI 示范讲解

### 通用功能
- 用户注册/登录系统
- 练习历史记录
- 个性化学习档案
- 语音合成 (TTS) 播放示范

---

## 4. 技术架构简介

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户界面 (Frontend)                      │
│                   Next.js + React + TypeScript                │
│                      Tailwind CSS 样式                        │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端服务 (Backend)                       │
│                   FastAPI + Python 3.12                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PPT 处理服务 │  │  语音服务    │  │  AI 分析服务  │       │
│  │ LibreOffice  │  │  ASR + TTS   │  │  LLM Client  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────┬───────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  OpenAI API  │    │ Whisper ASR  │    │  文件存储    │
│  GPT-4 Vision│    │  语音转文字   │    │  静态资源    │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 前端技术栈

| 技术 | 用途 |
|------|------|
| Next.js 14 | React 框架，支持 SSR/SSG |
| TypeScript | 类型安全的 JavaScript |
| Tailwind CSS | 原子化 CSS 框架 |
| React Hooks | 状态管理 |
| MediaRecorder API | 音视频录制 |
| Canvas API | PPT + 摄像头画中画合成 |

### 后端技术栈

| 技术 | 用途 |
|------|------|
| FastAPI | 高性能 Python Web 框架 |
| Python 3.12 | 后端开发语言 |
| OpenAI API | LLM 智能分析（GPT-4 Vision） |
| Whisper API | 语音转文字 (ASR) |
| Edge TTS | 语音合成 (TTS) |
| LibreOffice | PPT 转 PDF/图片 |
| pdf2image | PDF 转图片 |
| FFmpeg | 音视频处理 |

### 数据存储

| 存储类型 | 技术方案 |
|----------|----------|
| 用户数据 | 内存存储（Demo）/ SQLite |
| 静态文件 | 本地文件系统 |
| 临时数据 | 浏览器 LocalStorage |
| 会话管理 | JWT Token |

---

## 5. 团队分工

| 角色 | 负责内容 |
|------|----------|
| 产品设计 | 功能规划、用户体验设计、交互流程 |
| 前端开发 | Next.js 应用开发、UI 组件、录制功能 |
| 后端开发 | API 开发、AI 集成、PPT 处理 |
| AI 工程 | Prompt 设计、模型调优、分析算法 |
| 测试运维 | 功能测试、性能优化、部署上线 |

---

## 6. 应用截图

### 截图 1：首页 - 产品介绍
展示 SpeakMate 的核心价值主张和功能介绍，采用现代化渐变设计风格。

### 截图 2：练习模式选择页
三大练习模块卡片展示：自我介绍、面试模拟、PPT 演讲，每个模块配有图标、描述和功能列表。

### 截图 3：PPT 上传与预览
上传 PPT 后显示预览图和 AI 示范讲解区域，支持逐页查看和播放示范语音。

### 截图 4：PPT 演讲录制界面
全屏录制界面，左侧显示 PPT 幻灯片，右下角显示摄像头画中画，支持翻页和录制控制。

### 截图 5：AI 分析结果页
左右分栏布局：左侧回放录制视频，右侧展示 AI 分析结果（评分、优点、改进建议、示范讲解）。

---

# 第二部分：AI 编程使用报告

## 使用 Claude Code 解决具体编码问题

### 概述

在 SpeakMate 项目开发过程中，我们深度使用了 Claude Code（Anthropic 官方 CLI 工具）来辅助解决复杂的编码问题。以下是具体的使用案例和解决方案。

---

### 案例 1：PPT 录制后重新录制功能失效问题

#### 问题描述
用户在 PPT 演讲练习中完成一次录制后，点击"重新录制"按钮，摄像头无法再次启用，也没有按钮可以重新开启摄像头。

#### 与 Claude Code 的协作过程

**1. 问题诊断**

向 Claude Code 描述了问题现象：
```
当我选择重新录制后，摄像头就开不了了，没有 button 给我开了
```

Claude Code 首先使用 Read 工具阅读了 `PPTPresenter.tsx` 组件代码，分析了 MediaStream 和 MediaRecorder 的生命周期管理。

**2. 根因分析**

Claude Code 识别出问题根源：
- 音频轨道在录制时被共享给 Canvas Stream
- 当 MediaRecorder 停止时，共享的音频轨道可能被停用
- 导致原始 MediaStream 的轨道状态变为 'ended'
- `isCameraOn` 状态为 true 但实际轨道已失效

**3. 解决方案**

Claude Code 提供了以下修复代码：

```typescript
// 添加 canvasStreamRef 用于存储 canvas stream 引用
const canvasStreamRef = useRef<MediaStream | null>(null);

// 克隆音频轨道，避免影响原始媒体流
const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
if (audioTrack) {
  const clonedAudioTrack = audioTrack.clone();
  canvasStream.addTrack(clonedAudioTrack);
}

// 在停止录制时清理克隆的轨道
if (canvasStreamRef.current) {
  canvasStreamRef.current.getTracks().forEach(track => track.stop());
  canvasStreamRef.current = null;
}

// 重新录制时检查轨道状态并重连视频元素
const handleRerecord = () => {
  // ... 清理代码 ...

  const tracks = mediaStreamRef.current.getTracks();
  const allTracksActive = tracks.every(track => track.readyState === 'live');

  if (!allTracksActive) {
    setIsCameraOn(false);
    mediaStreamRef.current = null;
  } else {
    // 重新连接视频元素
    setTimeout(() => {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play();
    }, 100);
  }
};
```

#### 解决效果
- 修复了重新录制时摄像头无法使用的问题
- 确保音频轨道克隆不影响原始媒体流
- 添加了轨道状态验证和自动恢复机制

---

### 案例 2：AI 分析评分固定为 85 分问题

#### 问题描述
用户发现无论演讲表现如何，AI 分析结果的评分总是显示 85 分，怀疑 AI 没有真正进行分析。

#### 与 Claude Code 的协作过程

**1. 代码审查**

Claude Code 使用 Grep 和 Read 工具查找并阅读了后端 `ppt.py` 中的 `analyze_presentation_video` 函数。

**2. 问题诊断**

Claude Code 发现了多个问题：
- AI Prompt 不够具体，缺乏客观评分标准
- JSON 解析可能失败导致使用默认分数
- 缺少日志记录来追踪实际 AI 返回内容

**3. 解决方案**

Claude Code 重写了分析逻辑：

```python
# 1. 添加客观指标计算
transcript_word_count = len(transcript)
avg_words_per_slide = transcript_word_count / slide_count

# 计算关键词覆盖率
ppt_keywords = set()
for slide in slides:
    words = [w for w in slide.text_content.split() if len(w) > 1]
    ppt_keywords.update(words)
covered_keywords = sum(1 for kw in ppt_keywords if kw in transcript)
coverage_rate = (covered_keywords / len(ppt_keywords) * 100)

# 2. 改进 AI Prompt，添加具体评分标准
analysis_prompt = f"""
===== 客观数据分析 =====
- 讲解总字数：{transcript_word_count} 字
- 平均每页讲解：{avg_words_per_slide:.1f} 字
- 关键词覆盖率：{coverage_rate:.1f}%

===== 严格评分标准 =====
【90-100分 - 优秀】每页 150+ 字，覆盖率 80%+
【75-89分 - 良好】每页 80-150 字，覆盖率 60-80%
【60-74分 - 及格】每页 50-80 字，覆盖率 40-60%
...
"""

# 3. 增强 JSON 解析，多种方式提取
json_match = re.search(r'```json\s*(\{.*?\})\s*```', result, re.DOTALL)
if not json_match:
    json_match = re.search(r'\{[^{}]*"score"[^{}]*\}', result)

# 4. 添加基于客观数据的 fallback 评分
if not analysis_data:
    base_score = 50
    if avg_words_per_slide >= 150: base_score += 25
    if coverage_rate >= 80: base_score += 15
```

#### 解决效果
- 评分现在基于实际讲解内容变化
- 提供客观指标辅助 AI 判断
- 增加了评分的透明度和可解释性

---

### 案例 3：PPT 分析页面 UI 滚动问题

#### 问题描述
AI 分析结果展示后，右侧容器会无限向下扩展，导致页面很长，用户体验差。希望内容在容器内部滚动。

#### 与 Claude Code 的协作过程

**1. 需求理解**

Claude Code 读取了 `ppt-analysis.tsx` 文件，理解了当前的布局结构。

**2. 解决方案**

Claude Code 重构了布局，使用 Flexbox 实现固定高度内部滚动：

```tsx
{/* 主内容 - 固定高度布局 */}
<main className="h-[calc(100vh-80px)]">
  <div className="grid grid-cols-2 gap-6 h-full">
    {/* 左侧：视频 */}
    <div className="flex flex-col h-full">
      <video className="aspect-video" />
      <div className="mt-4 flex gap-3">
        {/* 操作按钮移到视频下方 */}
      </div>
    </div>

    {/* 右侧：AI 分析 - 内部滚动 */}
    <div className="flex flex-col h-full min-h-0">
      <h2>AI 智能分析</h2>
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {/* 分析内容 - 内部滚动 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 评分卡片 */}
          {/* 优点/改进并排 */}
          {/* 总体反馈 */}
          {/* AI 示范 */}
        </div>
      </div>
    </div>
  </div>
</main>
```

**3. UI 优化**

同时 Claude Code 还进行了 UI 美化：
- 将评分设计改为圆形徽章样式
- 优点和改进采用并排两栏布局
- 使用更紧凑的卡片设计
- 添加 `line-clamp-2` 限制文本行数

#### 解决效果
- 页面高度固定在视口内
- 分析结果在容器内平滑滚动
- UI 更加紧凑美观

---

### 案例 4：PPT 上传错误处理优化

#### 问题描述
PPT 上传失败时，用户看不到具体错误信息，不知道问题出在哪里。

#### Claude Code 解决方案

```typescript
// 前端添加详细错误处理
try {
  const result = await uploadPPT(file);
} catch (error) {
  if (error.message.includes('File processing failed')) {
    setError('PPT 处理失败，请确保文件格式正确（支持 PDF、PPT、PPTX）');
  } else if (error.message.includes('50MB')) {
    setError('文件大小超过限制（最大 50MB）');
  } else {
    setError(`上传失败: ${error.message}`);
  }
}

// 后端添加详细日志
logger.error(f"PPT upload error: {type(e).__name__}")
logger.error(f"Error details: {traceback.format_exc()}")
```

---

### 总结：Claude Code 的价值

在 SpeakMate 项目中，Claude Code 展现了以下价值：

| 能力 | 具体表现 |
|------|----------|
| **代码理解** | 快速阅读并理解复杂的 React/Python 代码逻辑 |
| **问题诊断** | 准确定位 Bug 根因，如 MediaStream 轨道管理问题 |
| **方案设计** | 提供完整、可执行的解决方案代码 |
| **最佳实践** | 遵循 React Hooks、Tailwind CSS 等最佳实践 |
| **UI/UX 优化** | 提供现代化、美观的界面设计建议 |
| **效率提升** | 大幅缩短问题排查和编码时间 |

Claude Code 不仅是一个代码补全工具，更是一个能够理解上下文、诊断问题、提供完整解决方案的 AI 编程伙伴。

---

*文档版本：1.0*
*更新日期：2025年12月31日*
*项目名称：SpeakMate - AI 口语教练平台*
