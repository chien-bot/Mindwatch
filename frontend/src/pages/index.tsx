/**
 * Home 首页
 * 产品介绍页面，包含 Hero、功能亮点、使用流程和页脚
 */

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Footer from '@/components/layout/Footer';

// 功能亮点数据
const FEATURES = [
  {
    icon: '🎤',
    title: '实时语音反馈',
    description:
      '录制你的发言，AI 会即时分析并给出专业建议，帮助你改进表达方式。',
  },
  {
    icon: '🎯',
    title: '多场景练习',
    description:
      '自我介绍、面试模拟、PPT 演讲，覆盖职场和学习中最重要的口语场景。',
  },
  {
    icon: '📈',
    title: '持续进步',
    description:
      '每次练习都能获得具体的改进建议，让你的表达能力稳步提升。',
  },
];

// 使用步骤数据
const STEPS = [
  {
    step: '01',
    title: '选择练习场景',
    description: '根据你的需求，选择自我介绍、面试模拟或 PPT 演讲模式。',
  },
  {
    step: '02',
    title: '开始录制练习',
    description: '打开摄像头和麦克风，像面对真实场景一样开始你的表达。',
  },
  {
    step: '03',
    title: '获取 AI 反馈',
    description: 'AI 会分析你的表达内容，给出结构优化和表达改进建议。',
  },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>SpeakMate - AI 口语教练 | 让表达更自信</title>
        <meta
          name="description"
          content="SpeakMate 是你的 AI 口语教练，帮助你练习自我介绍、模拟面试、提升演讲技巧。实时反馈，让进步看得见。"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Hero 区域 */}
      <HeroSection />

      {/* 功能亮点 */}
      <FeaturesSection />

      {/* 使用流程 */}
      <HowItWorksSection />

      {/* 页脚 */}
      <Footer />
    </>
  );
}

/**
 * Hero 区域组件
 * 首屏展示，包含主标题、副标题和 CTA 按钮
 */
function HeroSection() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 检查是否已登录
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleStartClick = () => {
    if (isLoggedIn) {
      router.push('/product');
    } else {
      router.push('/login');
    }
  };

  return (
    <section className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* 主标题 */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          <span className="block">让你的口语表达</span>
          <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            更加自信流畅
          </span>
        </h1>

        {/* 副标题 */}
        <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 leading-relaxed">
          SpeakMate 是你的 AI 口语教练，帮助你练习自我介绍、模拟面试、提升演讲技巧。
          <br className="hidden sm:block" />
          对着镜头练一遍，马上给你结构分析和改进建议。
        </p>

        {/* CTA 按钮 */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleStartClick}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-center"
          >
            {isLoggedIn ? '开始练习' : '立即开始'}
          </button>
          <a
            href="#features"
            className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl shadow-md border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 text-center"
          >
            了解更多
          </a>
        </div>

        {/* 装饰性卡片预览 */}
        <div className="mt-16 relative">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-auto border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg">
                🤖
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm text-gray-500 mb-1">AI 教练</p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  很棒的自我介绍！我注意到你提到了自己的专业背景，这很好。建议在开头加一个
                  <strong>吸引人的标签</strong>
                  ，比如"我是一个热爱解决问题的人"，这样能让别人更快记住你...
                </p>
              </div>
            </div>
          </div>
          {/* 背景装饰 */}
          <div className="absolute -z-10 top-4 left-1/2 -translate-x-1/2 w-[90%] h-full bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl blur-sm"></div>
        </div>
      </div>
    </section>
  );
}

/**
 * 功能亮点区域组件
 */
function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            功能亮点
          </h2>
          <p className="text-lg text-gray-600">为什么选择 SpeakMate</p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100"
            >
              <div className="text-5xl mb-6">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * 使用流程区域组件
 */
function HowItWorksSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            使用流程
          </h2>
          <p className="text-lg text-gray-600">
            简单三步，开始你的口语提升之旅
          </p>
        </div>

        {/* 步骤卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((item, index) => (
            <div key={index} className="relative">
              {/* 连接线（桌面端显示） */}
              {index < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-300 to-purple-300"></div>
              )}

              <div className="text-center relative z-10">
                {/* 步骤编号 */}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-3xl font-bold mb-6 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 max-w-xs mx-auto">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 底部 CTA */}
        <div className="text-center mt-16">
          <Link
            href="/product"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            立即开始练习
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
