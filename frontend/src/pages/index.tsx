/**
 * Home 首页
 * 产品介绍页面，包含 Hero、功能亮点、使用流程和页脚
 * 全屏滚动设计，每个部分占据一个完整视口
 */

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
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
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const sectionsRef = useRef<HTMLDivElement[]>([]);

  // 滚动到指定部分
  const scrollToSection = (index: number) => {
    if (isScrolling || index < 0 || index >= sectionsRef.current.length) return;

    setIsScrolling(true);
    setCurrentSection(index);

    sectionsRef.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  // 监听滚轮事件
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) return;

      e.preventDefault();

      if (e.deltaY > 0 && currentSection < sectionsRef.current.length - 1) {
        // 向下滚动
        scrollToSection(currentSection + 1);
      } else if (e.deltaY < 0 && currentSection > 0) {
        // 向上滚动
        scrollToSection(currentSection - 1);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [currentSection, isScrolling]);

  // 监听键盘事件（上下箭头）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScrolling) return;

      if (e.key === 'ArrowDown' && currentSection < sectionsRef.current.length - 1) {
        scrollToSection(currentSection + 1);
      } else if (e.key === 'ArrowUp' && currentSection > 0) {
        scrollToSection(currentSection - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSection, isScrolling]);

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

      {/* 滚动指示器 */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSection === index
                ? 'bg-blue-600 scale-125'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`跳转到第${index + 1}部分`}
          />
        ))}
      </div>

      {/* 向下滚动提示 */}
      {currentSection === 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-bounce">
          <button
            onClick={() => scrollToSection(1)}
            className="flex flex-col items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <span className="text-sm font-medium">向下滚动</span>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Hero 区域 */}
      <div ref={(el) => el && (sectionsRef.current[0] = el)}>
        <HeroSection onStartClick={() => scrollToSection(1)} />
      </div>

      {/* 功能亮点 */}
      <div ref={(el) => el && (sectionsRef.current[1] = el)}>
        <FeaturesSection />
      </div>

      {/* 使用流程 + 页脚 */}
      <div ref={(el) => el && (sectionsRef.current[2] = el)}>
        <HowItWorksSection />
        <Footer />
      </div>
    </>
  );
}

/**
 * Hero 区域组件
 * 首屏展示，包含主标题、副标题和 CTA 按钮
 */
function HeroSection({ onStartClick }: { onStartClick?: () => void }) {
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
    <section className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 relative overflow-hidden">
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 渐变球体 1 */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
        {/* 渐变球体 2 */}
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        {/* 网格背景 */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
        {/* 左侧：文字内容 */}
        <div className="text-center md:text-left">
          {/* 标签 */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md mb-6 border border-gray-200">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-gray-700">AI 驱动的口语教练</span>
          </div>

          {/* 主标题 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            让你的口语表达
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              更加自信流畅
            </span>
          </h1>

          {/* 副标题 */}
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            AI 实时分析你的表达，给出专业建议。
            <br />
            自我介绍、面试模拟、演讲练习，全方位提升。
          </p>

          {/* CTA 按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button
              onClick={handleStartClick}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-center relative overflow-hidden"
            >
              <span className="relative z-10">{isLoggedIn ? '开始练习' : '立即开始'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button
              onClick={onStartClick}
              className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl shadow-md border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-center"
            >
              了解更多
            </button>
          </div>

          {/* 统计数据 */}
          <div className="mt-12 flex gap-8 justify-center md:justify-start">
            <div className="text-center md:text-left">
              <div className="text-3xl font-bold text-gray-900">3+</div>
              <div className="text-sm text-gray-600">练习模式</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-3xl font-bold text-gray-900">AI</div>
              <div className="text-sm text-gray-600">实时反馈</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-3xl font-bold text-gray-900">24/7</div>
              <div className="text-sm text-gray-600">随时练习</div>
            </div>
          </div>
        </div>

        {/* 右侧：视觉元素 */}
        <div className="relative hidden md:block">
          {/* 装饰圆圈 - 移到后面 */}
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none">
            <div className="absolute inset-0 border-2 border-blue-200/20 rounded-full animate-ping"></div>
            <div className="absolute inset-8 border-2 border-purple-200/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          </div>

          {/* 主卡片容器 */}
          <div className="relative pt-6 pb-10 px-8">
            {/* AI 反馈卡片 */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 transform hover:scale-105 transition-transform duration-300 relative z-10">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                  🤖
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-semibold text-gray-900">AI 教练</p>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">在线</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    很棒的自我介绍！建议在开头加一个<strong className="text-blue-600">吸引人的标签</strong>，让别人更快记住你...
                  </p>
                </div>
              </div>

              {/* 进度条 */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>表达流畅度</span>
                  <span>85%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>

            {/* 浮动图标 - 调整位置 */}
            <div className="absolute top-0 right-2 w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl shadow-lg flex items-center justify-center text-xl animate-bounce z-20">
              🎯
            </div>

            {/* 浮动小卡片 - 调整位置 */}
            <div className="absolute bottom-2 left-2 bg-white rounded-xl shadow-lg p-3 border border-gray-100 animate-float z-20">
              <div className="flex items-center gap-2">
                <div className="text-xl">🎤</div>
                <div>
                  <div className="text-xs text-gray-500">语音识别</div>
                  <div className="text-xs font-semibold text-gray-900">实时转写</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 功能亮点区域组件
 */
function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section id="features" className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 动态圆圈 */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        {/* 浮动方块 */}
        <div className="absolute top-1/4 right-1/4 w-16 h-16 border-2 border-blue-300/20 rounded-lg rotate-45 animate-float"></div>
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 border-2 border-purple-300/20 rounded-lg rotate-12 animate-float" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 标题 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              三大核心功能
            </span>
          </h2>
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
            为什么选择我们
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI 驱动的智能口语教练，帮助你全方位提升表达能力
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className={`group relative transition-all duration-500 transform ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* 卡片背景光晕 */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500`}></div>

              {/* 主卡片 */}
              <div className="relative h-full bg-white rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 overflow-hidden">
                {/* 背景装饰 */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${
                  index === 0 ? 'from-blue-400/10 to-blue-600/10' :
                  index === 1 ? 'from-blue-400/10 to-purple-400/10' :
                  'from-purple-400/10 to-purple-600/10'
                } rounded-full blur-2xl transform translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-500`}></div>

                {/* 图标 */}
                <div className={`relative inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br ${
                  index === 0 ? 'from-blue-500 to-blue-600' :
                  index === 1 ? 'from-blue-500 to-purple-500' :
                  'from-purple-500 to-purple-600'
                } shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  <span className="text-3xl">{feature.icon}</span>
                </div>

                {/* 内容 */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {feature.description}
                </p>

                {/* 底部装饰条 */}
                <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${
                  index === 0 ? 'from-blue-500 to-blue-600' :
                  index === 1 ? 'from-blue-500 to-purple-500' :
                  'from-purple-500 to-purple-600'
                } transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部统计 */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          {[
            { value: '1000+', label: '练习次数' },
            { value: '95%', label: '满意度' },
            { value: '24/7', label: '在线服务' }
          ].map((stat, index) => (
            <div
              key={index}
              className={`text-center transition-all duration-500 transform ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${600 + index * 100}ms` }}
            >
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 动态圆圈 */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        {/* 浮动装饰 */}
        <div className="absolute top-1/3 left-1/4 w-20 h-20 border-2 border-blue-300/20 rounded-full animate-float"></div>
        <div className="absolute bottom-1/3 right-1/4 w-16 h-16 border-2 border-purple-300/20 rounded-full animate-float" style={{ animationDelay: '0.7s' }}></div>
      </div>

      <div className="flex-1 flex items-center justify-center py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* 标题 */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                使用流程
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              简单三步，开始你的口语提升之旅
            </p>
          </div>

          {/* 步骤卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {STEPS.map((item, index) => (
              <div
                key={index}
                className={`group relative transition-all duration-500 transform ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* 连接线（桌面端显示）- 增强效果 */}
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-1 bg-gradient-to-r from-blue-400/40 via-purple-400/40 to-purple-400/40 rounded-full">
                    <div className="h-full w-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full group-hover:w-full transition-all duration-1000"></div>
                  </div>
                )}

                <div className="text-center relative z-10">
                  {/* 步骤编号 - 增强设计 */}
                  <div className="relative inline-block mb-6">
                    {/* 外圈光晕 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 scale-110"></div>
                    {/* 主圆圈 */}
                    <div className={`relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${
                      index === 0 ? 'from-blue-600 to-blue-700' :
                      index === 1 ? 'from-blue-600 to-purple-600' :
                      'from-purple-600 to-purple-700'
                    } text-white text-3xl font-bold shadow-2xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                      <span className="relative z-10">{item.step}</span>
                      {/* 内圈装饰 */}
                      <div className="absolute inset-2 border-2 border-white/30 rounded-full"></div>
                    </div>
                  </div>

                  {/* 内容卡片 */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg group-hover:shadow-2xl transition-all duration-300 border border-gray-100">
                    <h3 className={`text-xl font-bold mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r ${
                      index === 0 ? 'group-hover:from-blue-600 group-hover:to-blue-700' :
                      index === 1 ? 'group-hover:from-blue-600 group-hover:to-purple-600' :
                      'group-hover:from-purple-600 group-hover:to-purple-700'
                    } group-hover:bg-clip-text transition-all duration-300 text-gray-900`}>
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>

                    {/* 底部装饰条 */}
                    <div className={`mt-4 h-1 bg-gradient-to-r ${
                      index === 0 ? 'from-blue-500 to-blue-600' :
                      index === 1 ? 'from-blue-500 to-purple-500' :
                      'from-purple-500 to-purple-600'
                    } transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-full`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 底部 CTA */}
          <div className="text-center mt-16 mb-12">
            <Link
              href="/product"
              className="group inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              <span className="relative z-10">立即开始练习</span>
              <svg
                className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
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
              {/* 悬停背景效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
