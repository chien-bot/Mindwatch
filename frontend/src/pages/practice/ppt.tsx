/**
 * PPT 演讲练习页
 * 流程：上传 PPT → 开始演讲 → 录制练习 → 获取 AI 反馈
 */

import Head from 'next/head';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import PPTUploader from '@/components/PPTUploader';
import PPTPresenter from '@/components/PPTPresenter';
import PPTDemoSection from '@/components/PPTDemoSection';
import { SlideContent, synthesizeSpeech } from '@/lib/api';

// 后端 API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// 将相对 URL 转换为完整 URL
const getFullImageUrl = (imageUrl: string): string => {
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  return `${API_BASE_URL}${imageUrl}`;
};

export default function PPTPracticePage() {
  const router = useRouter();
  const [slides, setSlides] = useState<SlideContent[] | null>(null);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  // 触发进入动画
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [isLoading]);

  /**
   * 处理 PPT 上传成功
   */
  const handleUploadSuccess = (uploadedSlides: SlideContent[], pptId: string) => {
    setSlides(uploadedSlides);
    setPresentationId(pptId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  /**
   * 开始演讲
   */
  const startPresentation = () => {
    setIsPresenting(true);
  };

  /**
   * 退出演讲
   */
  const exitPresentation = () => {
    setIsPresenting(false);
  };

  /**
   * 重新上传
   */
  const resetUpload = () => {
    setSlides(null);
    setPresentationId(null);
    setIsPresenting(false);
  };

  return (
    <>
      <Head>
        <title>PPT 演讲练习 - SpeakMate</title>
        <meta
          name="description"
          content="上传你的 PPT，AI 帮你练习演讲表达，逐页给出改进建议。"
        />
      </Head>

      {/* 练习页面 - 全屏沉浸式布局 */}
      <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
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

        {/* 顶部导航条（最小化设计） */}
        {!isPresenting && (
          <header className="relative z-10 flex-shrink-0 px-4 sm:px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* 返回按钮 - 左对齐 */}
              <Link
                href="/product"
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
                返回
              </Link>

              {/* 页面标题 - 居中 */}
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg">
                  📊
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    PPT 演讲练习
                  </h1>
                  <p className="text-xs text-gray-500 hidden sm:block">
                    AI 实时反馈，提升演讲能力
                  </p>
                </div>
              </div>

              {/* 占位（保持对称） */}
              <div className="w-20"></div>
            </div>
          </header>
        )}

        {/* 主内容区域 */}
        <main className="relative z-10 flex-1 overflow-y-auto">
          {isPresenting && slides && presentationId ? (
            // 演讲模式：全屏展示
            <PPTPresenter slides={slides} presentationId={presentationId} onExit={exitPresentation} />
          ) : slides ? (
            // 已上传 PPT：显示预览和开始按钮（左右布局）
            <div className="min-h-full flex items-center justify-center py-8 px-8">
              <div className="max-w-7xl w-full grid md:grid-cols-2 gap-8 items-start">
                {/* 左侧：PPT 预览 + 标题 + 开始演讲按钮 */}
                <div className={`transition-all duration-700 delay-100 ${
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
                }`}>
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-200/50">
                    {/* PPT 预览图 */}
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-6 group relative">
                      <img
                        src={getFullImageUrl(slides[0].image_url)}
                        alt="PPT Preview"
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* 光晕效果 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>

                    {/* PPT 已准备好标题 */}
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        PPT 已准备好
                      </h2>
                      <div className="flex items-center justify-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-semibold">共 {slides.length} 页幻灯片</span>
                      </div>
                    </div>

                    {/* 开始演讲按钮 */}
                    <button
                      onClick={startPresentation}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/50 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 text-lg mb-4"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      开始演讲
                    </button>

                    {/* 重新上传按钮 */}
                    <button
                      onClick={resetUpload}
                      className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-blue-400 font-semibold rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      重新上传
                    </button>
                  </div>
                </div>

                {/* 右侧：AI 示范讲解 */}
                <div className={`transition-all duration-700 delay-300 ${
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
                }`}>
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-200/50">
                    {/* AI 示范讲解区域 */}
                    <PPTDemoSection slides={slides} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // 未上传 PPT：显示上传界面
            <PPTUploader onUploadSuccess={handleUploadSuccess} />
          )}
        </main>
      </div>
    </>
  );
}
