/**
 * API 调用封装
 * 封装与后端的通信逻辑
 */

import { ChatRequest, ChatResponse } from '@/types/chat';

// 从环境变量获取 API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * 发送聊天消息
 * @param request 聊天请求对象
 * @returns AI 的回复
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `HTTP error! status: ${response.status}`
      );
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    console.error('发送消息失败:', error);
    throw error;
  }
}

/**
 * 健康检查
 * 检查后端服务是否正常运行
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.ok;
  } catch (error) {
    console.error('健康检查失败:', error);
    return false;
  }
}

/**
 * 上传自我介绍音频并获取反馈
 * @param audioBlob 录制的音频 Blob
 * @returns 包含转写文本和 AI 反馈的对象
 */
export async function uploadSelfIntroAudio(
  audioBlob: Blob
): Promise<{ transcript: string; reply: string; demo_text: string; mode: string }> {
  try {
    // 创建 FormData 并添加音频文件
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');

    const response = await fetch(`${API_BASE_URL}/api/v1/self_intro/audio`, {
      method: 'POST',
      body: formData,
      // 不设置 Content-Type，让浏览器自动设置 multipart/form-data boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `上传音频失败! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('上传音频失败:', error);
    throw error;
  }
}

// TODO: 将来接入语音功能时,可以在这里添加语音相关的 API 调用
/**
 * 上传音频文件并获取转录文本(ASR)
 * @param audioFile 音频文件
 * @returns 转录的文本
 */
export async function transcribeAudio(audioFile: File): Promise<string> {
  // TODO: 实现语音识别 API 调用
  throw new Error('语音识别功能尚未实现');
}

/**
 * 将文本转换为语音(TTS)
 * @param text 要转换的文本
 * @returns 音频 Blob URL (可用于 <audio> 元素)
 */
export async function synthesizeSpeech(text: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `语音合成失败! status: ${response.status}`
      );
    }

    // 获取音频二进制数据
    const audioBlob = await response.blob();

    // 创建 Blob URL
    const audioUrl = URL.createObjectURL(audioBlob);
    return audioUrl;
  } catch (error) {
    console.error('语音合成失败:', error);
    throw error;
  }
}

// ============= 面试相关 API =============

/**
 * 开始面试会话
 */
export interface InterviewStartRequest {
  position: string;  // 岗位 ID
}

export interface InterviewStartResponse {
  session_id: string;
  first_question: string;
  first_question_audio_required: boolean;
}

export async function startInterview(position: string): Promise<InterviewStartResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/interview/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ position }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `开始面试失败! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('开始面试失败:', error);
    throw error;
  }
}

/**
 * 提交面试回答
 */
export interface InterviewAnswerRequest {
  session_id: string;
  text_answer?: string;
  audio_data?: string;  // Base64 编码
  conversation_history: Array<{ role: string; content: string }>;
}

export interface InterviewAnswerResponse {
  next_question?: string;
  is_finished: boolean;
  final_feedback?: string;
}

export async function submitInterviewAnswer(
  sessionId: string,
  answer: string
): Promise<InterviewAnswerResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/interview/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        text_answer: answer,
        conversation_history: [],  // 后端会自动管理历史
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `提交回答失败! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('提交回答失败:', error);
    throw error;
  }
}

// ============= PPT 相关 API =============

/**
 * PPT 幻灯片内容
 */
export interface SlideContent {
  slide_number: number;
  image_url: string;
  text_content: string;
  demo_script?: string; // AI 示范讲解话术
}

/**
 * PPT 上传响应
 */
export interface PPTUploadResponse {
  presentation_id: string;
  total_slides: number;
  slides: SlideContent[];
}

/**
 * 上传 PPT 文件
 * @param file PPT/PDF 文件
 * @returns PPT 解析结果
 */
export async function uploadPPT(file: File): Promise<PPTUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/v1/ppt/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `上传 PPT 失败! status: ${response.status}`
      );
    }

    const data: PPTUploadResponse = await response.json();
    return data;
  } catch (error) {
    console.error('上传 PPT 失败:', error);
    throw error;
  }
}

/**
 * 幻灯片分析响应
 */
export interface SlideAnalysisResponse {
  slide_number: number;
  feedback: string;
  suggestions: string[];
  score?: number;
}

/**
 * 分析幻灯片讲解（使用 Vision API）
 * @param presentationId PPT 演示文稿 ID
 * @param slideNumber 幻灯片编号
 * @param slideText 幻灯片文字内容
 * @param transcript 用户讲解的转写文本
 * @returns AI 分析结果（包含示范教学和 PPT 优化建议）
 */
export async function analyzeSlide(
  presentationId: string,
  slideNumber: number,
  slideText: string,
  transcript: string
): Promise<SlideAnalysisResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/ppt/analyze-slide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        presentation_id: presentationId,
        slide_number: slideNumber,
        slide_text: slideText,
        transcript: transcript,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `分析幻灯片失败! status: ${response.status}`
      );
    }

    const data: SlideAnalysisResponse = await response.json();
    return data;
  } catch (error) {
    console.error('分析幻灯片失败:', error);
    throw error;
  }
}

/**
 * 示范语音响应
 */
export interface DemoSpeechResponse {
  slide_number: number;
  demo_script: string;
  audio_url: string;
}

/**
 * 生成幻灯片 AI 示范讲解语音
 * @param presentationId PPT 演示文稿 ID
 * @param slideNumber 幻灯片编号
 * @param slideText 幻灯片文字内容
 * @returns 示范话术和语音 URL
 */
export async function generateDemoSpeech(
  presentationId: string,
  slideNumber: number,
  slideText: string
): Promise<DemoSpeechResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/ppt/generate-demo-speech`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentation_id: presentationId,
          slide_number: slideNumber,
          slide_text: slideText,
          transcript: '', // 生成示范时不需要用户讲解
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `生成示范语音失败! status: ${response.status}`
      );
    }

    const data: DemoSpeechResponse = await response.json();
    return data;
  } catch (error) {
    console.error('生成示范语音失败:', error);
    throw error;
  }
}

/**
 * 视频分析响应
 */
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

/**
 * 分析 PPT 演讲视频
 * @param videoBlob 视频 Blob
 * @param presentationId PPT 演示文稿 ID
 * @returns AI 分析结果（包含评分、反馈和示范）
 */
export async function analyzePresentationVideo(
  videoBlob: Blob,
  presentationId: string
): Promise<VideoAnalysisResponse> {
  try {
    const formData = new FormData();
    formData.append('file', videoBlob, 'presentation.webm');
    formData.append('presentation_id', presentationId);

    const response = await fetch(`${API_BASE_URL}/api/v1/ppt/analyze-video`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `视频分析失败! status: ${response.status}`
      );
    }

    const data: VideoAnalysisResponse = await response.json();
    return data;
  } catch (error) {
    console.error('视频分析失败:', error);
    throw error;
  }
}
