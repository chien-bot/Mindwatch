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

  // 检查登录状态
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

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
      <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* 顶部导航条（最小化设计） */}
        {!isPresenting && (
          <header className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-4 sm:px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* 返回按钮 */}
              <Link
                href="/product"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm group"
              >
                <svg
                  className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
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

              {/* 页面标题 */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-50"></div>
                  <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PPT 演讲练习
                </h1>
              </div>

              {/* 占位（保持对称） */}
              <div className="w-16"></div>
            </div>
          </header>
        )}

        {/* 主内容区域 */}
        <main className="flex-1 overflow-y-auto">
          {isPresenting && slides && presentationId ? (
            // 演讲模式：全屏展示
            <PPTPresenter slides={slides} presentationId={presentationId} onExit={exitPresentation} />
          ) : slides ? (
            // 已上传 PPT：显示预览和开始按钮
            <div className="min-h-full flex flex-col items-center py-8 px-8">
              <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    PPT 已准备好
                  </h2>
                </div>

                {/* PPT 预览 */}
                <div className="mb-8">
                  <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl mb-4 border border-white/10">
                    <img
                      src={getFullImageUrl(slides[0].image_url)}
                      alt="PPT Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-center text-gray-600 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    共 {slides.length} 页幻灯片
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-4">
                  <button
                    onClick={startPresentation}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    开始演讲
                  </button>

                  <button
                    onClick={resetUpload}
                    className="px-6 py-4 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-gray-400 font-semibold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
                  >
                    重新上传
                  </button>
                </div>

                {/* 使用提示 */}
                <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      演讲技巧
                    </h3>
                  </div>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      使用键盘左右箭头键翻页
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      点击幻灯片或使用翻页按钮
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      录制完成后可查看回放或获取 AI 分析
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      建议录制完整演讲以获得最佳 AI 反馈
                    </li>
                  </ul>
                </div>

                {/* AI 示范讲解区域 */}
                <PPTDemoSection slides={slides} />
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
