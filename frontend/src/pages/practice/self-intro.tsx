/**
 * 自我介绍练习页
 * 沉浸式练习体验，复用 ChatWindow 组件（固定为 self_intro 模式）
 */

import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ChatWindow from '@/components/ChatWindow';

export default function SelfIntroPage() {
  const router = useRouter();
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

  return (
    <>
      <Head>
        <title>自我介绍练习 - SpeakMate</title>
        <meta
          name="description"
          content="练习你的自我介绍，获得 AI 实时反馈。支持摄像头录制和语音转写。"
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg">
                👋
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  自我介绍练习
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  AI 实时反馈，提升表达能力
                </p>
              </div>
            </div>

            {/* 占位（保持对称） */}
            <div className="w-20"></div>
          </div>
        </header>

        {/* 主内容区域 - ChatWindow 占据剩余空间 */}
        <main className="relative z-10 flex-1 overflow-hidden">
          <ChatWindow fixedMode="self_intro" showHeader={false} />
        </main>
      </div>
    </>
  );
}
