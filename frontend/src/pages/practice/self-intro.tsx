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
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
        {/* 顶部导航条（最小化设计） */}
        <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* 返回按钮 */}
            <Link
              href="/product"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm"
            >
              <svg
                className="w-4 h-4"
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
            <div className="flex items-center gap-2">
              <span className="text-2xl">👋</span>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                自我介绍练习
              </h1>
            </div>

            {/* 占位（保持对称） */}
            <div className="w-16"></div>
          </div>
        </header>

        {/* 主内容区域 - ChatWindow 占据剩余空间 */}
        <main className="flex-1 overflow-hidden">
          <ChatWindow fixedMode="self_intro" showHeader={false} />
        </main>
      </div>
    </>
  );
}
