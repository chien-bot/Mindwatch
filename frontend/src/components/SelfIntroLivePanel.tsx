/**
 * 自我介绍 Live 练习面板组件
 * 功能：摄像头预览 + 录音 + 上传音频到后端
 */

import React, { useState, useRef, useEffect } from 'react';
import { uploadSelfIntroAudio } from '@/lib/api';

interface SelfIntroLivePanelProps {
  onTranscriptReceived: (transcript: string, reply: string, demoText: string) => void;
}

// 录制状态枚举
type RecordingState = 'idle' | 'recording' | 'processing';

export default function SelfIntroLivePanel({
  onTranscriptReceived,
}: SelfIntroLivePanelProps) {
  // 状态管理
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [isCameraOn, setIsCameraOn] = useState(false); // 摄像头是否开启
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 组件卸载时停止媒体流
  useEffect(() => {
    return () => {
      stopMediaStream();
    };
  }, []);

  // 当摄像头开启时，确保视频流绑定到 video 元素
  useEffect(() => {
    if (isCameraOn && mediaStreamRef.current && videoRef.current) {
      console.log('useEffect: 绑定视频流');
      videoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [isCameraOn]);

  /**
   * 开启摄像头
   */
  const startCamera = async () => {
    try {
      console.log('正在请求摄像头权限...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log('摄像头权限已获取，stream:', stream);
      mediaStreamRef.current = stream;
      setHasPermission(true);
      setError(null);

      // 等待状态更新后再绑定视频流
      setIsCameraOn(true);

      // 使用 setTimeout 确保 DOM 已更新
      setTimeout(() => {
        if (videoRef.current) {
          console.log('绑定视频流到 video 元素');
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error('视频播放失败:', err);
          });
        } else {
          console.error('videoRef.current 为 null');
        }
      }, 100);
    } catch (err) {
      console.error('无法获取媒体权限:', err);
      setHasPermission(false);
      setError('无法访问摄像头或麦克风，请检查浏览器权限设置。');
    }
  };

  /**
   * 关闭摄像头
   */
  const stopCamera = () => {
    stopMediaStream();
    setIsCameraOn(false);
    setHasPermission(null);
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
   * 开始录制
   */
  const startRecording = () => {
    if (!mediaStreamRef.current || !isCameraOn) {
      setError('请先开启摄像头。');
      return;
    }

    try {
      // 清空之前的录音数据
      audioChunksRef.current = [];

      // 创建 MediaRecorder
      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: 'audio/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // 录制结束，上传音频
        await handleRecordingComplete();
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecordingState('recording');
      setError(null);
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
   * 处理录制完成
   */
  const handleRecordingComplete = async () => {
    setRecordingState('processing');

    try {
      // 将录音数据合并成一个 Blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // 上传到后端
      const result = await uploadSelfIntroAudio(audioBlob);

      // 通知父组件
      onTranscriptReceived(result.transcript, result.reply, result.demo_text || '');

      setRecordingState('idle');
    } catch (err) {
      console.error('上传音频失败:', err);
      setError(err instanceof Error ? err.message : '上传音频失败，请重试。');
      setRecordingState('idle');
    }
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

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-lg p-6">
      {/* 标题和说明 */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          📹 Live 练习区
        </h2>
        <p className="text-sm text-gray-600">
          打开摄像头，对着自己练习自我介绍吧！
          <br />
          录一段 30 秒左右的自我介绍，AI 会帮你分析和改进。
        </p>
      </div>

      {/* 摄像头预览区域 */}
      <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden mb-4">
        {!isCameraOn ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
            <svg
              className="w-16 h-16 mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-center text-lg mb-2">摄像头未开启</p>
            <p className="text-sm text-gray-400 text-center mb-4">
              点击下方按钮开启摄像头和麦克风
            </p>
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              开启摄像头
            </button>
            {hasPermission === false && (
              <p className="text-sm text-red-400 text-center mt-4">
                无法访问摄像头，请检查浏览器权限设置
              </p>
            )}
          </div>
        ) : (
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {recordingState === 'recording' && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full z-10">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">录制中</span>
              </div>
            )}
            {/* 关闭摄像头按钮 */}
            <button
              onClick={stopCamera}
              className="absolute top-4 left-4 p-2 bg-gray-800/70 hover:bg-gray-800 text-white rounded-lg transition-colors z-10"
              title="关闭摄像头"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 控制按钮 */}
      <div className="flex flex-col gap-3">
        <button
          onClick={toggleRecording}
          disabled={!isCameraOn || recordingState === 'processing'}
          className={`
            w-full py-4 rounded-lg font-semibold text-white transition-all duration-200
            flex items-center justify-center gap-2
            ${
              !isCameraOn || recordingState === 'processing'
                ? 'bg-gray-400 cursor-not-allowed'
                : recordingState === 'idle'
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                : 'bg-red-500 hover:bg-red-600 active:bg-red-700'
            }
          `}
        >
          {recordingState === 'idle' && (
            <>
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <circle cx="10" cy="10" r="8" />
              </svg>
              开始录制
            </>
          )}
          {recordingState === 'recording' && (
            <>
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <rect x="6" y="6" width="8" height="8" />
              </svg>
              停止录制
            </>
          )}
          {recordingState === 'processing' && (
            <>
              <div className="loading-dot inline-block w-2 h-2 bg-white rounded-full"></div>
              正在分析...
            </>
          )}
        </button>

        {/* 提示文字 */}
        <p className="text-xs text-gray-500 text-center">
          {!isCameraOn && '请先开启摄像头'}
          {isCameraOn && recordingState === 'idle' &&
            '点击"开始录制"，然后说出你的自我介绍'}
          {isCameraOn && recordingState === 'recording' && '说完后点击"停止录制"'}
          {isCameraOn && recordingState === 'processing' && '正在分析你的自我介绍，请稍候...'}
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
