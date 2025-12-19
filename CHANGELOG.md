# 更新日志

## [v1.1.0] - 2025-12-10

### 🎉 重大更新：自我介绍 Live 练习区

这次更新为"自我介绍"模式添加了全新的 **Live 练习区**功能，让用户可以对着摄像头真实练习自我介绍，并获得 AI 反馈。

---

### ✨ 新增功能

#### 1. 自我介绍 Live 练习面板
- **摄像头实时预览**：打开浏览器摄像头，实时看到自己
- **一键录音功能**：点击按钮开始/停止录制
- **音频自动上传**：录制完成后自动上传到后端分析
- **智能状态提示**：录制中、处理中等状态清晰显示
- **权限友好处理**：如果用户拒绝摄像头权限，提供友好提示和重试按钮

**文件位置**：
- 前端组件：[frontend/src/components/SelfIntroLivePanel.tsx](frontend/src/components/SelfIntroLivePanel.tsx)

#### 2. 后端音频上传接口
- **新接口**：`POST /api/v1/self_intro/audio`
- **功能**：接收音频文件，转写成文本，调用 LLM 获取反馈
- **当前状态**：使用 Mock 转写数据（返回固定示例文本）
- **扩展性**：预留 TODO 注释，方便日后接入真实 ASR

**文件位置**：
- 后端接口：[backend/app/api/v1/self_intro_audio.py](backend/app/api/v1/self_intro_audio.py)
- 数据模型：[backend/app/models/audio.py](backend/app/models/audio.py)

#### 3. 两栏布局（自我介绍模式专属）
- **左栏**：Live 练习区（摄像头 + 录音）
- **右栏**：聊天记录 + AI 反馈
- **响应式设计**：
  - 桌面端（≥768px）：左右两栏
  - 移动端（<768px）：上下堆叠

**修改文件**：
- [frontend/src/components/ChatWindow.tsx](frontend/src/components/ChatWindow.tsx)：主容器布局逻辑
- [frontend/src/styles/globals.css](frontend/src/styles/globals.css)：响应式样式

---

### 🔧 技术改进

#### 前端
1. **新增 API 函数**：`uploadSelfIntroAudio()`
   - 位置：[frontend/src/lib/api.ts](frontend/src/lib/api.ts)
   - 功能：将录制的音频 Blob 上传到后端

2. **MediaRecorder 集成**
   - 使用浏览器原生 `MediaRecorder` API 录制音频
   - 支持 `audio/webm` 格式
   - 自动管理媒体流生命周期

3. **状态管理优化**
   - 新增 `handleTranscriptReceived` 回调函数
   - 将转写结果和 AI 反馈自动添加到聊天记录

#### 后端
1. **路由注册**
   - 在 [backend/app/main.py](backend/app/main.py) 中注册新路由
   - 路径：`/api/v1/self_intro/audio`

2. **音频处理流程**
   - 接收 `multipart/form-data` 格式的音频文件
   - Mock 转写成示例文本
   - 调用现有 LLM 客户端获取自我介绍反馈
   - 返回 JSON：`{ transcript, reply, mode }`

3. **代码质量**
   - 添加详细的中文注释
   - 标注 TODO 位置，方便日后接入真实 ASR
   - 错误处理和日志记录

---

### 📖 文档更新

1. **主 README.md**
   - 新增 Live 练习区功能介绍
   - 新增音频上传接口 API 文档
   - 新增"接入真实 ASR"教程
   - 更新项目结构图

2. **新增 QUICKSTART.md**
   - 5 分钟快速启动指南
   - 常见问题解答
   - 功能演示说明

3. **新增 CHANGELOG.md**（本文件）
   - 详细记录更新内容

---

### 🎨 UI/UX 优化

1. **响应式布局**
   - 使用 Tailwind 的 `md:` 断点实现响应式
   - 移动端自动切换为单栏布局
   - 摄像头区域在移动端固定高度 400px

2. **视觉优化**
   - Live 练习区使用卡片样式（白底、圆角、阴影）
   - 录制状态用红点 + 动画提示
   - 权限拒绝时显示友好图标和说明文案

3. **动画效果**
   - 消息气泡滑入动画（已有）
   - 加载点跳动动画（已有）
   - 录制按钮状态转场动画

---

### 🔮 预留扩展点

代码中已留下清晰的 TODO 注释，方便日后扩展：

#### 1. 接入真实语音识别（ASR）
**位置**：[backend/app/api/v1/self_intro_audio.py](backend/app/api/v1/self_intro_audio.py) 第 58-72 行

**示例代码已提供**：
```python
# TODO: 在这里接入真实的语音识别 API
# 支持：OpenAI Whisper, Google Cloud, Azure, 阿里云等
```

#### 2. 接入语音合成（TTS）
**位置**：[backend/app/core/llm_client.py](backend/app/core/llm_client.py) 第 199-233 行

**功能**：将 AI 反馈转为语音播放

#### 3. 其他模式的 Live 练习
当前只有自我介绍模式支持 Live 练习，未来可以扩展到：
- PPT 演讲模式：对着摄像头练习演讲，AI 分析表达和肢体语言
- 面试模拟模式：实时视频面试，AI 扮演面试官

---

### 📊 功能完成度

- [x] 自我介绍 Live 练习区 UI
- [x] 摄像头和麦克风权限处理
- [x] 音频录制功能
- [x] 音频上传接口
- [x] Mock 音频转写
- [x] AI 反馈生成
- [x] 响应式布局
- [x] 详细文档
- [ ] 真实 ASR 接入（待实现）
- [ ] 语音合成（待实现）
- [ ] 其他模式的 Live 支持（待实现）

---

### 🚀 如何使用

#### 快速体验
1. 启动后端和前端（见 [QUICKSTART.md](QUICKSTART.md)）
2. 打开浏览器访问 http://localhost:3000
3. 选择 **"自我介绍"** 模式
4. 允许摄像头和麦克风权限
5. 点击 **"开始录制"**，说一段自我介绍
6. 点击 **"停止录制"**，查看 AI 反馈

#### 接入真实 ASR
详见 [README.md - 接入真实的语音识别](README.md#接入真实的语音识别asr)

---

### 🙏 致谢

感谢你对 SpeakMate 的支持！如果有任何问题或建议，欢迎提 Issue。

---

## [v1.0.0] - 初始版本

### ✨ 核心功能
- 三种练习模式：PPT 演讲、面试模拟、自我介绍
- 实时聊天界面
- AI 教练反馈（Mock LLM）
- 响应式设计
- 模块化架构
- 预留语音接口

详见 [README.md](README.md)
