/**
 * AI 面试语音通话页面 - 真实 API 版本
 * 支持与 AI 面试官进行多轮对话
 */

import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { startInterview, submitInterviewAnswer, synthesizeSpeech } from '@/lib/api';

// 通话状态
type CallState = 'countdown' | 'calling' | 'connecting' | 'connected' | 'ended';

// 对话记录
interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

// 岗位映射
const POSITION_MAP: { [key: string]: string } = {
  frontend: '前端工程师',
  backend: '后端工程师',
  product: '产品经理',
  designer: 'UI/UX 设计师',
  data: '数据分析师',
  marketing: '市场营销',
};

export default function InterviewCallPage() {
  const router = useRouter();
  const { position } = router.query;

  const [callState, setCallState] = useState<CallState>('countdown');
  const [countdown, setCountdown] = useState(5);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const callStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef<boolean>(false);

  // 岗位名称
  const positionName = POSITION_MAP[position as string] || '未知岗位';

  // 解锁音频上下文（Safari 需要用户交互后才能播放音频）
  const unlockAudioContext = () => {
    if (audioUnlockedRef.current) return;

    // 创建一个静音的短音频来解锁音频上下文
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    silentAudio.volume = 0.01;
    silentAudio.play().then(() => {
      audioUnlockedRef.current = true;
      console.log('音频上下文已解锁');
    }).catch(() => {
      console.log('静音音频播放失败，可能需要更多用户交互');
    });
  };

  // 5秒倒计时
  useEffect(() => {
    if (callState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (callState === 'countdown' && countdown === 0) {
      // 倒计时结束，切换到 'ready' 状态，等待用户点击开始
      setCallState('calling' as CallState);
    }
  }, [callState, countdown, position]);

  // 空格键录音功能
  useEffect(() => {
    if (callState !== 'connected') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 按下空格键开始录音
      if (e.code === 'Space' && !isRecording && !isSpeaking && !isProcessing) {
        e.preventDefault();
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // 松开空格键停止录音
      if (e.code === 'Space' && isRecording) {
        e.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [callState, isRecording, isSpeaking, isProcessing]);

  // 初始化 - 开始面试
  const initInterview = async () => {
    if (!position) return;

    // 在用户点击时立即解锁音频上下文（必须在用户交互的同步调用链中）
    unlockAudioContext();

    try {
      setCallState('connecting');

      // 调用后端 API 开始面试
      const response = await startInterview(position as string);
      setSessionId(response.session_id);

      // 模拟连接延迟
      setTimeout(async () => {
        await handleCallConnected(response.first_question);
      }, 1500);
    } catch (err) {
      console.error('开始面试失败:', err);
      setError('连接失败，请重试');
      setTimeout(() => router.push('/practice/interview'), 3000);
    }
  };

  // 计时器
  useEffect(() => {
    if (callState === 'connected') {
      callStartTimeRef.current = Date.now();
      durationIntervalRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(elapsed);
      }, 1000);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callState]);

  /**
   * 通话接通 - 播放第一个问题
   */
  const handleCallConnected = async (firstQuestion: string) => {
    setCallState('connected');

    // 请求麦克风权限
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setError(null);
    } catch (err) {
      console.error('麦克风权限获取失败:', err);
      setError('无法访问麦克风，请检查浏览器权限设置');
    }

    // AI 打招呼 + 第一个问题（合并成一句话）
    setTimeout(async () => {
      const openingMessage = `你好，我是今天的面试官。欢迎参加${positionName}的面试。${firstQuestion}`;
      await speakMessage(openingMessage, 'ai');
    }, 500);
  };

  /**
   * AI 说话（添加消息 + TTS 播放）
   * 返回 Promise，在音频播放完成后 resolve
   */
  const speakMessage = async (content: string, role: 'ai' | 'user' = 'ai'): Promise<void> => {
    // 添加到消息列表
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);

    if (role === 'ai') {
      setIsSpeaking(true);

      try {
        // 调用 TTS API
        const audioUrl = await synthesizeSpeech(content);

        // 播放语音并等待完成
        await new Promise<void>((resolve, reject) => {
          const audio = new Audio(audioUrl);
          currentAudioRef.current = audio;

          // 监听播放结束
          audio.onended = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            resolve();
          };

          audio.onerror = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            console.error('语音播放失败');
            resolve(); // 即使失败也 resolve，不阻塞后续流程
          };

          // 尝试播放
          audio.play().then(() => {
            console.log('音频播放成功');
          }).catch((error: Error) => {
            console.error('音频播放被阻止:', error);

            if (error.name === 'NotAllowedError') {
              // 设置一次性点击事件，用户点击后重试播放
              const handleClick = () => {
                audio.play().then(() => {
                  console.log('用户点击后音频播放成功');
                  setError(null);
                }).catch(() => {
                  console.error('点击后播放仍然失败');
                  setIsSpeaking(false);
                  resolve();
                });
                document.removeEventListener('click', handleClick);
              };
              document.addEventListener('click', handleClick, { once: true });
              setError('请点击页面任意位置以播放音频');
            } else {
              setIsSpeaking(false);
              URL.revokeObjectURL(audioUrl);
              resolve();
            }
          });
        });
      } catch (err) {
        console.error('TTS 失败:', err);
        setIsSpeaking(false);
        // 即使 TTS 失败也继续（用户可以看文字）
      }
    }
  };

  /**
   * 开始录音
   */
  const startRecording = async () => {
    if (isSpeaking || isProcessing) {
      return; // AI 说话时或处理中不能录音
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleAudioRecorded(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('开始录音失败:', err);
      setError('无法开始录音，请检查麦克风权限');
    }
  };

  /**
   * 停止录音
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  /**
   * 处理录制的音频
   */
  const handleAudioRecorded = async (audioBlob: Blob) => {
    console.log('音频录制完成，大小:', audioBlob.size);
    setIsProcessing(true);

    try {
      // 上传音频到后端，获取转写结果
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('session_id', sessionId || '');

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/v1/interview/answer/audio`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('音频上传失败');
      }

      const data = await response.json();
      const userAnswer = data.transcript;

      if (!userAnswer || !userAnswer.trim()) {
        setIsProcessing(false);
        setError('未能识别语音，请重试');
        return;
      }

      // 添加用户消息
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: userAnswer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // 提交回答给后端
      if (!sessionId) {
        throw new Error('会话ID不存在');
      }

      const aiResponse = await submitInterviewAnswer(sessionId, userAnswer);

      // 检查是否面试结束
      if (aiResponse.is_finished && aiResponse.final_feedback) {
        // 面试结束
        setTimeout(async () => {
          const endMessage = '好的，我的问题就到这里。现在给你总体评价：';
          await speakMessage(endMessage, 'ai');

          setTimeout(async () => {
            // 显示最终评价（可选择性播放）
            await speakMessage(aiResponse.final_feedback!, 'ai');

            setTimeout(() => {
              handleEndCall();
            }, 3000);
          }, 2000);
        }, 1000);
      } else if (aiResponse.next_question) {
        // 继续下一轮 - 直接播放 AI 返回的内容（包含回应+下一个问题）
        setTimeout(async () => {
          await speakMessage(aiResponse.next_question!, 'ai');
        }, 1000);
      }
    } catch (err) {
      console.error('处理回答失败:', err);
      setError('处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 结束通话
   */
  const handleEndCall = () => {
    setCallState('ended');
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // 停止当前播放的音频
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

    // 跳转到首页（暂时不跳结果页）
    setTimeout(() => {
      router.push('/practice/interview');
    }, 2000);
  };

  /**
   * 格式化时间
   */
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Head>
        <title>AI 面试进行中 - SpeakMate</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
        {/* 通话界面 */}
        <div className="max-w-md w-full">
          {/* 5秒倒计时准备 */}
          {callState === 'countdown' && (
            <div className="text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                  <div className="text-8xl font-bold text-white animate-pulse">{countdown}</div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">面试即将开始</h2>
              <p className="text-xl text-gray-300 mb-2">{positionName}</p>
              <p className="text-sm text-gray-400">请深呼吸，放轻松</p>

              <div className="mt-8 space-y-2 text-sm text-blue-300">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>检查麦克风权限</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <span>连接 AI 面试官</span>
                </div>
              </div>
            </div>
          )}

          {/* 准备开始 */}
          {callState === 'calling' && (
            <div className="text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full blur-3xl opacity-50"></div>
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">准备就绪！</h2>
              <p className="text-gray-400 mb-6">{positionName} - AI 面试官</p>
              <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                点击下方按钮开始面试。面试过程中，AI 会通过语音提问，你可以按住按钮或空格键录音回答。
              </p>
              <button
                onClick={initInterview}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-green-500/50 transition-all transform hover:scale-105 text-lg"
              >
                🎙️ 开始面试
              </button>
              <p className="text-xs text-gray-600 mt-4">
                💡 提示：点击按钮后，请允许浏览器播放音频
              </p>
            </div>
          )}

          {/* 连接中 */}
          {callState === 'connecting' && (
            <div className="text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl animate-bounce">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">连接中...</h2>
              <p className="text-gray-400">{positionName} - AI 面试官</p>
              <div className="mt-6 flex justify-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}

          {/* 通话中 */}
          {callState === 'connected' && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              {/* 头像和状态 */}
              <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                  {isSpeaking && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping"></div>
                    </>
                  )}
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{positionName}</h3>
                <p className="text-sm text-gray-400 mb-2">AI 面试官</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-500/50 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-300">{formatDuration(callDuration)}</span>
                </div>
              </div>

              {/* 对话记录（滚动区域） */}
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-2xl border border-white/10 p-4 mb-6 max-h-60 overflow-y-auto backdrop-blur-sm">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm">等待 AI 面试官...</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2 rounded-xl ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : 'bg-gray-700/50 text-gray-200 border border-gray-600'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {msg.timestamp.toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 rounded-xl text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* 录音按钮 */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={isSpeaking || isProcessing}
                  className={`relative w-20 h-20 rounded-full transition-all duration-200 ${
                    isRecording
                      ? 'bg-red-500 shadow-2xl shadow-red-500/50 scale-110'
                      : isSpeaking || isProcessing
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <svg className="w-10 h-10 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    {isRecording
                      ? '🔴 松开结束录音'
                      : isSpeaking
                      ? '🔊 AI 面试官正在说话...'
                      : isProcessing
                      ? '⏳ 处理中...'
                      : '按住按钮或空格键录音回答'}
                  </p>
                  {!isRecording && !isSpeaking && !isProcessing && (
                    <p className="text-xs text-gray-500 mt-1">
                      💡 提示：按住空格键（Spacebar）即可录音
                    </p>
                  )}
                </div>

                {/* 挂断按钮 */}
                <button
                  onClick={handleEndCall}
                  className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg"
                >
                  结束面试
                </button>
              </div>
            </div>
          )}

          {/* 通话结束 */}
          {callState === 'ended' && (
            <div className="text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="relative inline-block mb-8">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center shadow-2xl">
                  <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">面试已结束</h2>
              <p className="text-gray-400">感谢参加本次面试</p>
              <p className="text-sm text-gray-500 mt-2">时长: {formatDuration(callDuration)}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
