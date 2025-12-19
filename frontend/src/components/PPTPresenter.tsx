/**
 * PPT 演讲组件 - 完整版
 * 功能：
 * - 录制视频（摄像头）+ 音频
 * - 录制完成后选择：回放 或 发送给 AI 分析
 * - 显示 AI 反馈
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { analyzeSlide, SlideContent } from '@/lib/api';
import { setTempVideo } from '@/lib/videoStore';

interface PPTPresenterProps {
  slides: SlideContent[];
  presentationId: string;
  onExit: () => void;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'processing';

// 后端 API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// 将相对 URL 转换为完整 URL
const getFullImageUrl = (imageUrl: string): string => {
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  return `${API_BASE_URL}${imageUrl}`;
};

export default function PPTPresenter({ slides, presentationId, onExit }: PPTPresenterProps) {
  const router = useRouter();

  // 状态管理
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [slideNotes, setSlideNotes] = useState<{ [key: number]: string }>({});
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showPlaybackModal, setShowPlaybackModal] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const slideImagesRef = useRef<{ [key: number]: HTMLImageElement }>({});
  const currentSlideRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopMediaStream();
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  // 同步 currentSlide 到 ref - 这个必须立即同步，不能有延迟
  useEffect(() => {
    currentSlideRef.current = currentSlide;
  }, [currentSlide]);

  // 同步 recordingState 到 ref
  useEffect(() => {
    isRecordingRef.current = recordingState === 'recording';
  }, [recordingState]);

  // 预加载所有幻灯片图片
  useEffect(() => {
    // 清空之前的缓存
    slideImagesRef.current = {};

    slides.forEach((slide, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getFullImageUrl(slide.image_url);
      img.onload = () => {
        slideImagesRef.current[index] = img;
      };
    });
  }, [slides]);

  // 回放视频设置
  useEffect(() => {
    if (showPlaybackModal && playbackVideoRef.current && recordedVideoUrl) {
      const video = playbackVideoRef.current;

      // 先暂停并重置任何现有播放
      video.pause();
      video.currentTime = 0;

      // 短暂延迟后设置新视频源
      const timeoutId = setTimeout(() => {
        if (playbackVideoRef.current) {
          video.src = recordedVideoUrl;

          // 等待视频可以播放
          const handleCanPlay = () => {
            console.log('视频已准备好，开始播放');
            video.play().catch((err) => {
              console.error('回放失败:', err);
            });
          };

          video.addEventListener('canplay', handleCanPlay, { once: true });
          video.load();
        }
      }, 200);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [showPlaybackModal, recordedVideoUrl]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPreviousSlide();
      } else if (e.key === 'ArrowRight') {
        goToNextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  /**
   * 开启摄像头
   */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      mediaStreamRef.current = stream;
      setIsCameraOn(true);
      setError(null);

      // 使用 setTimeout 确保 state 更新后再设置视频
      setTimeout(() => {
        if (videoRef.current && mediaStreamRef.current) {
          videoRef.current.srcObject = mediaStreamRef.current;
          videoRef.current.play().catch((err) => {
            console.error('视频播放失败:', err);
          });
        }
      }, 100);
    } catch (err) {
      console.error('无法获取媒体权限:', err);
      setError('无法访问摄像头或麦克风，请检查浏览器权限设置。');
    }
  };

  /**
   * 关闭摄像头
   */
  const stopCamera = () => {
    stopMediaStream();
    setIsCameraOn(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  /**
   * 停止媒体流
   */
  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  /**
   * 在 Canvas 上绘制 PPT + 摄像头画中画
   */
  const drawCanvasFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Canvas 尺寸设置为 1920x1080 (16:9) - 只设置一次
    if (canvas.width !== 1920 || canvas.height !== 1080) {
      canvas.width = 1920;
      canvas.height = 1080;
    }

    // 清空 Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 使用 ref 获取最新的 currentSlide（重要：这里必须用 ref 而不是 state）
    const slideIndex = currentSlideRef.current;

    // 获取预加载的图片
    const pptImage = slideImagesRef.current[slideIndex];

    if (pptImage && pptImage.complete && pptImage.naturalWidth > 0) {
      // 绘制 PPT 幻灯片（占满整个 Canvas）
      ctx.drawImage(pptImage, 0, 0, canvas.width, canvas.height);
    } else if (slides[slideIndex]) {
      // 如果预加载图片不可用，尝试直接绘制
      // 创建一个临时图片来绘制当前幻灯片
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      const imgUrl = getFullImageUrl(slides[slideIndex].image_url);

      // 尝试使用已缓存的图片
      if (!slideImagesRef.current[slideIndex]) {
        tempImg.src = imgUrl;
        tempImg.onload = () => {
          slideImagesRef.current[slideIndex] = tempImg;
        };
      }

      // 显示加载中背景
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Slide ${slideIndex + 1}`, canvas.width / 2, canvas.height / 2);
    }

    // 检查视频是否准备好
    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      // 绘制摄像头画面（右下角，画中画效果）
      const camWidth = 320;  // 摄像头窗口宽度
      const camHeight = 180; // 摄像头窗口高度 (16:9)
      const padding = 20;    // 边距

      // 计算摄像头位置（右下角）
      const camX = canvas.width - camWidth - padding;
      const camY = canvas.height - camHeight - padding;

      // 绘制摄像头背景
      ctx.fillStyle = '#000000';
      ctx.fillRect(camX - 2, camY - 2, camWidth + 4, camHeight + 4);

      // 绘制摄像头画面
      try {
        ctx.drawImage(video, camX, camY, camWidth, camHeight);
      } catch (e) {
        // 忽略绘制错误
      }

      // 绘制摄像头边框
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.strokeRect(camX - 2, camY - 2, camWidth + 4, camHeight + 4);
    }
  };

  /**
   * 开始录制（录制 Canvas: PPT + 摄像头画中画）
   */
  const startRecording = () => {
    if (!mediaStreamRef.current || !isCameraOn) {
      setError('请先开启摄像头。');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) {
      setError('Canvas 初始化失败');
      return;
    }

    try {
      recordedChunksRef.current = [];

      // 设置 Canvas 尺寸
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Canvas context 初始化失败');
        return;
      }

      // 用于追踪上一帧的幻灯片索引，避免重复日志
      let lastLoggedSlide = -1;

      // 开始绘制动画循环 - 直接在这里绘制，确保每帧都获取最新的 ref 值
      const drawLoop = () => {
        // 每帧都从 ref 获取最新的幻灯片索引
        const slideIndex = currentSlideRef.current;

        // 只在幻灯片切换时打印日志
        if (slideIndex !== lastLoggedSlide) {
          console.log('[drawLoop] 绘制幻灯片:', slideIndex, '图片已加载:', !!slideImagesRef.current[slideIndex]);
          lastLoggedSlide = slideIndex;
        }

        // 清空 Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 获取预加载的图片
        const pptImage = slideImagesRef.current[slideIndex];

        if (pptImage && pptImage.complete && pptImage.naturalWidth > 0) {
          // 绘制 PPT 幻灯片
          ctx.drawImage(pptImage, 0, 0, canvas.width, canvas.height);
        } else {
          // 图片未加载，尝试立即加载
          console.log('[drawLoop] 幻灯片', slideIndex, '图片未就绪，尝试加载');
          // 显示加载中背景
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ffffff';
          ctx.font = '48px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Slide ${slideIndex + 1}`, canvas.width / 2, canvas.height / 2);
        }

        // 绘制摄像头画面（右下角）
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          const camWidth = 320;
          const camHeight = 180;
          const padding = 20;
          const camX = canvas.width - camWidth - padding;
          const camY = canvas.height - camHeight - padding;

          ctx.fillStyle = '#000000';
          ctx.fillRect(camX - 2, camY - 2, camWidth + 4, camHeight + 4);

          try {
            ctx.drawImage(video, camX, camY, camWidth, camHeight);
          } catch (e) {
            // 忽略绘制错误
          }

          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 4;
          ctx.strokeRect(camX - 2, camY - 2, camWidth + 4, camHeight + 4);
        }

        // 使用 ref 检查是否继续录制
        if (isRecordingRef.current && mediaRecorderRef.current?.state === 'recording') {
          animationFrameRef.current = requestAnimationFrame(drawLoop);
        }
      };

      // 从 Canvas 获取视频流
      const canvasStream = canvas.captureStream(30); // 30 FPS

      // 从摄像头获取音频流
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
      }

      // 创建 MediaRecorder 录制 Canvas 流
      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log('[MediaRecorder] 收到数据块，大小:', event.data.size);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('[MediaRecorder] 录制停止，共收集', recordedChunksRef.current.length, '个数据块');
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        handleRecordingStop();
      };

      // 先设置 ref 和状态
      mediaRecorderRef.current = mediaRecorder;
      isRecordingRef.current = true;

      // 每100ms请求一次数据，确保数据被正确收集
      mediaRecorder.start(100);
      setRecordingState('recording');
      setError(null);

      console.log('[startRecording] 录制已开始');

      // 开始绘制循环
      drawLoop();
    } catch (err) {
      console.error('开始录制失败:', err);
      setError('开始录制失败，请重试。');
    }
  };

  /**
   * 停止录制
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  /**
   * 处理录制停止
   */
  const handleRecordingStop = () => {
    console.log('[handleRecordingStop] 处理录制停止，数据块数量:', recordedChunksRef.current.length);

    if (recordedChunksRef.current.length === 0) {
      console.error('[handleRecordingStop] 没有录制到数据！');
      setError('录制失败：没有捕获到视频数据');
      setRecordingState('idle');
      return;
    }

    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
    console.log('[handleRecordingStop] 创建 Blob，大小:', blob.size, 'bytes');
    recordedBlobRef.current = blob;

    const url = URL.createObjectURL(blob);
    console.log('[handleRecordingStop] 视频 URL:', url);
    setRecordedVideoUrl(url);
    setRecordingState('recorded');

    // 显示选择模态框
    setShowChoiceModal(true);
  };

  /**
   * 选择回放视频
   */
  const handlePlayback = () => {
    console.log('开始回放，视频 URL:', recordedVideoUrl);
    setShowChoiceModal(false);
    setShowPlaybackModal(true);
  };

  /**
   * 关闭回放模态框
   */
  const closePlaybackModal = () => {
    setShowPlaybackModal(false);
    if (playbackVideoRef.current) {
      playbackVideoRef.current.pause();
      playbackVideoRef.current.currentTime = 0;
    }
  };

  /**
   * 重新录制
   */
  const handleRerecord = () => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    recordedBlobRef.current = null;
    setRecordingState('idle');
    setShowPlaybackModal(false);
    setShowChoiceModal(false);
  };

  /**
   * 下载视频
   */
  const handleDownloadVideo = () => {
    if (!recordedBlobRef.current) {
      console.error('没有可下载的视频');
      return;
    }

    // 创建下载链接
    const url = URL.createObjectURL(recordedBlobRef.current);
    const a = document.createElement('a');
    a.href = url;

    // 生成文件名：PPT演讲录制_日期时间.webm
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    a.download = `PPT演讲录制_${timestamp}.webm`;

    // 触发下载
    document.body.appendChild(a);
    a.click();

    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('[handleDownloadVideo] 视频下载已开始');
  };

  /**
   * 选择发送给 AI 分析
   */
  const handleSendToAI = async () => {
    setShowChoiceModal(false);
    setShowPlaybackModal(false);

    // 将 Blob 和 presentation ID 保存到全局临时存储
    if (recordedBlobRef.current) {
      setTempVideo(recordedBlobRef.current, presentationId);
    }

    // 跳转到 AI 分析页面
    router.push('/practice/ppt-analysis');
  };

  /**
   * 切换录制状态
   */
  const toggleRecording = () => {
    if (recordingState === 'idle') {
      startRecording();
    } else if (recordingState === 'recording') {
      stopRecording();
    }
  };

  /**
   * 翻页功能 - 同时更新 state 和 ref
   */
  const goToPreviousSlide = () => {
    setCurrentSlide((prev) => {
      const newIndex = Math.max(0, prev - 1);
      currentSlideRef.current = newIndex; // 立即更新 ref
      console.log('[goToPreviousSlide] 切换到幻灯片:', newIndex, 'ref 值:', currentSlideRef.current);
      return newIndex;
    });
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => {
      const newIndex = Math.min(slides.length - 1, prev + 1);
      currentSlideRef.current = newIndex; // 立即更新 ref
      console.log('[goToNextSlide] 切换到幻灯片:', newIndex, 'ref 值:', currentSlideRef.current);
      return newIndex;
    });
  };

  const goToSlide = (index: number) => {
    currentSlideRef.current = index; // 立即更新 ref
    console.log('[goToSlide] 切换到幻灯片:', index, 'ref 值:', currentSlideRef.current);
    setCurrentSlide(index);
  };

  return (
    <div className="h-full flex gap-6 p-6 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
      {/* 隐藏的 Canvas 用于录制 PPT + 摄像头 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* 左侧：摄像头和控制区域 */}
      <div className="w-2/5 flex flex-col gap-5">
        {/* 摄像头预览 */}
        <div className="flex-1 relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-xl">
          {!isCameraOn ? (
            // 摄像头关闭状态
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl mb-3 font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                准备开始演讲
              </h3>
              <p className="text-gray-400 mb-8 text-center max-w-xs">
                开启摄像头，让 AI 帮你提升演讲技巧
              </p>
              <button
                onClick={startCamera}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transform hover:-translate-y-1 flex items-center gap-3"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                开启摄像头
              </button>
            </div>
          ) : (
            // 摄像头开启状态
            <div className="absolute inset-0 group">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* 录制指示器 */}
              {recordingState === 'recording' && (
                <div className="absolute top-5 right-5 flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-500 text-white px-5 py-3 rounded-full shadow-2xl z-10 animate-pulse">
                  <div className="relative">
                    <div className="w-3 h-3 bg-white rounded-full animate-ping absolute"></div>
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <span className="font-bold text-sm">REC</span>
                </div>
              )}

              {/* 关闭摄像头按钮 */}
              <button
                onClick={stopCamera}
                className="absolute top-5 left-5 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full transition-all z-10 opacity-0 group-hover:opacity-100 transform hover:scale-110"
                title="关闭摄像头"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* 渐变遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            </div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="space-y-3">
          {recordingState === 'recorded' ? (
            // 录制完成状态：显示回放和重新录制按钮
            <div className="flex gap-3">
              <button
                onClick={handlePlayback}
                className="flex-1 py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                回放视频
              </button>
              <button
                onClick={handleRerecord}
                className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl shadow-lg transition-all"
              >
                重录
              </button>
            </div>
          ) : (
            // 正常录制按钮
            <button
              onClick={toggleRecording}
              disabled={!isCameraOn || recordingState === 'processing'}
              className={`
                w-full py-4 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-xl
                flex items-center justify-center gap-2 transform hover:-translate-y-0.5
                ${
                  !isCameraOn || recordingState === 'processing'
                    ? 'bg-gray-600 cursor-not-allowed'
                    : recordingState === 'idle'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
                }
              `}
            >
              {recordingState === 'idle' && '🎤 开始录制'}
              {recordingState === 'recording' && '⏹️ 停止录制'}
              {recordingState === 'processing' && '⏳ AI 分析中...'}
            </button>
          )}

          <button
            onClick={onExit}
            className="w-full py-3 rounded-xl font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-all border border-gray-700"
          >
            退出演讲
          </button>
        </div>

        {/* AI 反馈区域 */}
        {slideNotes[currentSlide] && (
          <div className="p-5 bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl shadow-lg border border-blue-700/50 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2">
              <span className="text-lg">🤖</span>
              AI 反馈
            </h3>
            <p className="text-sm text-gray-200 leading-relaxed">
              {slideNotes[currentSlide]}
            </p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-600 rounded-lg text-red-200 text-sm backdrop-blur-sm">
            {error}
          </div>
        )}
      </div>

      {/* 右侧：PPT 展示区域 */}
      <div className="flex-1 flex flex-col bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
        {/* PPT 幻灯片 */}
        <div className="flex-1 relative bg-gray-800 flex items-center justify-center p-8">
          <img
            src={getFullImageUrl(slides[currentSlide].image_url)}
            alt={`Slide ${currentSlide + 1}`}
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
          />

          {/* 页码指示器 */}
          <div className="absolute bottom-6 right-6 px-5 py-3 bg-gray-900/90 text-white rounded-xl font-bold text-lg shadow-xl border border-gray-700">
            {currentSlide + 1} / {slides.length}
          </div>

          {/* 翻页按钮 */}
          <button
            onClick={goToPreviousSlide}
            disabled={currentSlide === 0}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNextSlide}
            disabled={currentSlide === slides.length - 1}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 缩略图导航 */}
        <div className="h-36 bg-gray-800 border-t border-gray-700 p-4 overflow-x-auto">
          <div className="flex gap-3 h-full">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`
                  flex-shrink-0 h-full aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105
                  ${
                    index === currentSlide
                      ? 'border-blue-500 shadow-lg shadow-blue-500/50'
                      : 'border-gray-600 hover:border-blue-400'
                  }
                `}
              >
                <img
                  src={getFullImageUrl(slide.image_url)}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 选择模态框 - 增强动画 */}
      {showChoiceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-700 animate-in zoom-in-95 duration-300">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4 animate-in zoom-in duration-500">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">录制完成！</h2>
              <p className="text-gray-300">
                选择你接下来想做的事情
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handlePlayback}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                查看回放
              </button>
              <button
                onClick={handleSendToAI}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                发送给 AI 分析
              </button>
              <button
                onClick={handleRerecord}
                className="w-full py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                重新录制
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 回放模态框 - 增强动画 */}
      {showPlaybackModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <video
              ref={playbackVideoRef}
              controls
              className="w-full h-full object-contain"
            />
            <button
              onClick={closePlaybackModal}
              className="absolute top-4 right-4 p-3 bg-gray-800/90 hover:bg-gray-700 text-white rounded-full transition-all transform hover:scale-110 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4 flex-wrap">
              <button
                onClick={handleDownloadVideo}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                下载视频
              </button>
              <button
                onClick={handleRerecord}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                重新录制
              </button>
              <button
                onClick={() => {
                  closePlaybackModal();
                  handleSendToAI();
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI 分析
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
