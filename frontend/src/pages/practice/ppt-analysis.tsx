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
  const [showTranscript, setShowTranscript] = useState(false);
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

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
        {/* 顶部导航 */}
        <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={handleBackToPractice}
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors font-medium group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回练习
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-50"></div>
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI 分析结果
              </h1>
            </div>

            <div className="w-24"></div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左侧：视频回放 */}
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                你的演讲录像
              </h2>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full aspect-video bg-black"
                  />
                )}
              </div>
            </div>

            {/* 右侧：AI 分析 */}
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                AI 智能分析
              </h2>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl p-8 border border-white/10">
                {isAnalyzing ? (
                  // 分析中动画
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                      <div className="relative w-24 h-24 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <p className="mt-6 text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      AI 正在分析你的演讲...
                    </p>
                    <p className="mt-2 text-sm text-gray-400">正在转写音频并生成反馈</p>

                    <div className="mt-8 w-full max-w-md">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>分析进度</span>
                        <span className="animate-pulse">处理中...</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse w-[90%] shadow-lg shadow-blue-500/50"></div>
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  // 错误状态
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-red-400 font-semibold text-lg mb-2">{error}</p>
                    <button
                      onClick={handleBackToPractice}
                      className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all"
                    >
                      返回重试
                    </button>
                  </div>
                ) : analysisData ? (
                  // 分析结果
                  <div className="space-y-6">
                    {/* 分析完成提示 */}
                    <div className="p-4 bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl border-l-4 border-green-500 backdrop-blur-sm">
                      <p className="text-green-400 font-semibold flex items-center gap-2 m-0">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        分析完成！
                      </p>
                    </div>

                    {/* 总体评分 */}
                    <div className="p-6 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-2xl border border-indigo-500/30">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        总体评分
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                          {analysisData.overall_score}
                        </div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-1000"
                              style={{ width: `${analysisData.overall_score}%` }}
                            />
                          </div>
                          <p className="text-sm text-gray-400 mt-2">满分 100 分</p>
                        </div>
                      </div>
                    </div>

                    {/* 转写文本（可展开） */}
                    <div className="border border-gray-700 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setShowTranscript(!showTranscript)}
                        className="w-full px-6 py-4 bg-gray-800/50 hover:bg-gray-800 transition-colors flex items-center justify-between"
                      >
                        <span className="font-semibold text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          你的演讲转写文本
                        </span>
                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${showTranscript ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showTranscript && (
                        <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-700">
                          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{analysisData.transcript}</p>
                        </div>
                      )}
                    </div>

                    {/* 优点 */}
                    <div className="p-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-2xl border border-green-500/30">
                      <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        做得好的地方
                      </h3>
                      <ul className="space-y-2">
                        {analysisData.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-3 text-gray-200">
                            <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 需要改进 */}
                    <div className="p-6 bg-gradient-to-br from-orange-900/20 to-yellow-900/20 rounded-2xl border border-orange-500/30">
                      <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        需要改进的地方
                      </h3>
                      <ul className="space-y-2">
                        {analysisData.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start gap-3 text-gray-200">
                            <svg className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 总体反馈 */}
                    <div className="p-6 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-2xl border border-blue-500/30">
                      <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        总体反馈
                      </h3>
                      <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{analysisData.overall_feedback}</p>
                    </div>

                    {/* AI 示范讲解 */}
                    <div className="p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl border border-purple-500/30">
                      <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        AI 示范讲解
                      </h3>
                      <div className="mb-4">
                        <button
                          onClick={handlePlayDemo}
                          disabled={isPlayingDemo}
                          className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                            isPlayingDemo
                              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:shadow-purple-500/50'
                          }`}
                        >
                          {isPlayingDemo ? (
                            <span className="flex items-center gap-2">
                              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              播放中...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                              听 AI 示范讲解
                            </span>
                          )}
                        </button>
                      </div>
                      <details className="group">
                        <summary className="cursor-pointer text-purple-300 hover:text-purple-200 font-medium flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          查看示范讲解文本
                        </summary>
                        <div className="mt-3 p-4 bg-gray-900/50 rounded-xl">
                          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{analysisData.demo_script}</p>
                        </div>
                      </details>
                    </div>

                    {/* 具体建议 */}
                    {analysisData.suggestions.length > 0 && (
                      <div className="p-6 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-2xl border border-cyan-500/30">
                        <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          具体建议
                        </h3>
                        <ul className="space-y-2">
                          {analysisData.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-3 text-gray-200">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleBackToPractice}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:-translate-y-0.5"
                      >
                        再练一次
                      </button>
                      <Link
                        href="/product"
                        className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl shadow-lg transition-all text-center transform hover:-translate-y-0.5"
                      >
                        返回首页
                      </Link>
                    </div>
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
