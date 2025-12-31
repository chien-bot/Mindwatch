/**
 * PPT 演讲 AI 分析页面
 * 显示录制视频的 AI 分析结果
 */

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { getTempVideoData, clearTempVideo } from '@/lib/videoStore';
import { analyzePresentationVideo, VideoAnalysisResponse, synthesizeSpeech } from '@/lib/api';

export default function PPTAnalysisPage() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisData, setAnalysisData] = useState<VideoAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let createdBlobUrl: string | null = null;

    // 从全局临时存储获取视频数据
    const videoData = getTempVideoData();

    if (videoData && videoData.blob) {
      // 创建 Blob URL
      const url = URL.createObjectURL(videoData.blob);
      createdBlobUrl = url;
      setVideoUrl(url);

      // 调用真实 API 分析视频
      analyzeVideo(videoData.blob, videoData.presentationId);
    } else {
      // 如果没有视频，返回练习页面
      console.warn('没有找到视频数据，返回练习页面');
      router.push('/practice/ppt');
    }

    // 触发进入动画
    setTimeout(() => setIsVisible(true), 100);

    return () => {
      // 清理 blob URL 和 audio
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [router]);

  // 调用 API 分析视频
  const analyzeVideo = async (videoBlob: Blob, presentationId: string) => {
    try {
      setIsAnalyzing(true);
      setError(null);

      const result = await analyzePresentationVideo(videoBlob, presentationId);
      setAnalysisData(result);
      setIsAnalyzing(false);
    } catch (err) {
      console.error('视频分析失败:', err);
      setError('分析失败，请稍后重试');
      setIsAnalyzing(false);
    }
  };

  // 播放 AI 示范讲解
  const handlePlayDemo = async () => {
    if (!analysisData?.demo_script) return;

    try {
      setIsPlayingDemo(true);

      // 停止之前的播放
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // 调用 TTS API 生成语音
      const audioUrl = await synthesizeSpeech(analysisData.demo_script);

      // 创建并播放音频
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlayingDemo(false);
      };

      audio.onerror = () => {
        setIsPlayingDemo(false);
        console.error('音频播放失败');
      };

      await audio.play();
    } catch (err) {
      console.error('播放示范失败:', err);
      setIsPlayingDemo(false);
    }
  };

  const handleBackToPractice = () => {
    // 清理临时视频数据
    clearTempVideo();
    router.push('/practice/ppt');
  };

  return (
    <>
      <Head>
        <title>AI 分析结果 - PPT 演讲练习</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* 背景装饰元素 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* 动态渐变圆圈 */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          {/* 浮动装饰图形 */}
          <div className="absolute top-1/4 right-1/4 w-20 h-20 border-2 border-blue-300/20 rounded-full animate-float"></div>
          <div className="absolute bottom-1/4 left-1/4 w-16 h-16 border-2 border-purple-300/20 rounded-lg rotate-45 animate-float" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/3 left-1/5 w-12 h-12 border-2 border-pink-300/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* 顶部导航 */}
        <header className="relative z-10 px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* 返回按钮 */}
            <button
              onClick={handleBackToPractice}
              className="group inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-xl shadow-md hover:shadow-lg text-gray-700 hover:text-blue-600 transition-all duration-300 font-medium text-sm border border-gray-200/50"
            >
              <svg
                className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              返回练习
            </button>

            {/* 页面标题 - 居中 */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI 分析结果
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  查看你的演讲表现与改进建议
                </p>
              </div>
            </div>

            {/* 占位 */}
            <div className="w-24"></div>
          </div>
        </header>

        {/* 主内容 - 固定高度布局 */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 h-[calc(100vh-80px)]">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 h-full transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {/* 左侧：视频回放 */}
            <div className="flex flex-col h-full">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-4 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                你的演讲录像
              </h2>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-gray-200/50 flex-shrink-0">
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full aspect-video bg-black"
                  />
                )}
              </div>

              {/* 视频下方的快速操作按钮 */}
              <div className="mt-4 flex gap-3 flex-shrink-0">
                <button
                  onClick={handleBackToPractice}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  再练一次
                </button>
                <Link
                  href="/product"
                  className="flex-1 py-3 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-blue-400 font-semibold rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  返回首页
                </Link>
              </div>
            </div>

            {/* 右侧：AI 分析 - 固定高度内部滚动 */}
            <div className="flex flex-col h-full min-h-0">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-4 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                AI 智能分析
              </h2>

              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 flex-1 min-h-0 overflow-hidden flex flex-col">
                {isAnalyzing ? (
                  // 分析中动画
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                      <div className="relative w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <p className="mt-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      AI 正在分析你的演讲...
                    </p>
                    <p className="mt-2 text-sm text-gray-500">正在转写音频并生成反馈</p>

                    <div className="mt-8 w-full max-w-md">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>分析进度</span>
                        <span className="animate-pulse">处理中...</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse w-[90%] shadow-lg shadow-blue-500/30"></div>
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  // 错误状态
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-red-600 font-semibold text-lg mb-2">{error}</p>
                    <button
                      onClick={handleBackToPractice}
                      className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all"
                    >
                      返回重试
                    </button>
                  </div>
                ) : analysisData ? (
                  // 分析结果 - 内部滚动区域
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                    {/* 总体评分 - 更紧凑的设计 */}
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                            <span className="text-2xl font-bold text-white">{analysisData.overall_score}</span>
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center">
                            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-600 mb-1">总体评分</h3>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-1000"
                              style={{ width: `${analysisData.overall_score}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {analysisData.overall_score >= 90 ? '优秀' :
                             analysisData.overall_score >= 75 ? '良好' :
                             analysisData.overall_score >= 60 ? '及格' : '需努力'} · 满分 100 分
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 优点和需改进 - 并排紧凑布局 */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* 优点 */}
                      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <h3 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          做得好的地方
                        </h3>
                        <ul className="space-y-1.5">
                          {analysisData.strengths.slice(0, 3).map((strength, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                              <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="line-clamp-2">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 需要改进 */}
                      <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                        <h3 className="text-sm font-bold text-orange-700 mb-2 flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          需要改进
                        </h3>
                        <ul className="space-y-1.5">
                          {analysisData.improvements.slice(0, 3).map((improvement, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                              <svg className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              <span className="line-clamp-2">{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* 总体反馈 */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <h3 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        总体反馈
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{analysisData.overall_feedback}</p>
                    </div>

                    {/* 转写文本（可展开） */}
                    <details className="border border-gray-200 rounded-xl overflow-hidden bg-white group">
                      <summary className="px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer">
                        <span className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          你的演讲转写文本
                        </span>
                        <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-4 py-3 bg-white border-t border-gray-200">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{analysisData.transcript}</p>
                      </div>
                    </details>

                    {/* AI 示范讲解 */}
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-purple-700 flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          AI 示范讲解
                        </h3>
                        <button
                          onClick={handlePlayDemo}
                          disabled={isPlayingDemo}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow ${
                            isPlayingDemo
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:shadow-lg'
                          }`}
                        >
                          {isPlayingDemo ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              播放中
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                              听示范
                            </span>
                          )}
                        </button>
                      </div>
                      <details className="group">
                        <summary className="cursor-pointer text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1.5">
                          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          查看示范文本
                        </summary>
                        <div className="mt-2 p-3 bg-white/80 rounded-lg border border-purple-100 max-h-32 overflow-y-auto">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{analysisData.demo_script}</p>
                        </div>
                      </details>
                    </div>

                    {/* 具体建议 */}
                    {analysisData.suggestions.length > 0 && (
                      <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                        <h3 className="text-sm font-bold text-cyan-700 mb-2 flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          改进建议
                        </h3>
                        <ul className="space-y-1.5">
                          {analysisData.suggestions.slice(0, 4).map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <span className="line-clamp-2">{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
