/**
 * Product 产品页
 * 展示 3 个练习模块卡片，用户可以选择进入不同的练习模式
 */

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// 模块卡片数据
interface ModuleCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  features: string[];
  href: string;
  available: boolean;
  buttonText: string;
}

const MODULES: ModuleCard[] = [
  {
    id: 'self-intro',
    icon: '👋',
    title: '自我介绍练习',
    description: '打造让人印象深刻的自我介绍，无论是面试、社交还是演讲开场。',
    features: ['摄像头实时预览', '语音录制与转写', 'AI 结构分析', '个性化改进建议'],
    href: '/practice/self-intro',
    available: true,
    buttonText: 'Try me',
  },
  {
    id: 'interview',
    icon: '💼',
    title: '面试模拟',
    description: '模拟真实面试场景，通过语音通话与 AI 面试官对话，提升面试表现。',
    features: ['语音通话面试', '多岗位选择', 'AI 智能追问', 'STAR 法则指导'],
    href: '/practice/interview',
    available: true,
    buttonText: 'Try me',
  },
  {
    id: 'ppt',
    icon: '📊',
    title: 'PPT 演讲练习',
    description: '提升演讲表达能力，让你的 PPT 汇报更加专业有说服力。',
    features: ['上传 PPT 文件', '逐页演讲录制', 'AI 逐页反馈', '键盘快捷翻页'],
    href: '/practice/ppt',
    available: true,
    buttonText: 'Try me',
  },
];

export default function Product() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 检查用户登录状态
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        // 未登录，重定向到登录页
        router.push('/login');
        return;
      }

      try {
        setUser(JSON.parse(userData));
        setIsLoading(false);
      } catch (error) {
        // token 或用户数据无效
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // 触发进入动画
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [isLoading]);

  const handleCardClick = (module: ModuleCard) => {
    if (module.available) {
      router.push(module.href);
    }
  };

  // 加载中显示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
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
        <title>练习模式 - SpeakMate</title>
        <meta
          name="description"
          content="选择适合你的练习模式：自我介绍、面试模拟、PPT 演讲。SpeakMate 帮你提升口语表达能力。"
        />
      </Head>

      {/* 页面内容 */}
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-24 pb-16 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* 动态圆圈 */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          {/* 浮动装饰元素 */}
          <div className="absolute top-1/4 right-1/4 w-20 h-20 border-2 border-blue-300/20 rounded-full animate-float"></div>
          <div className="absolute bottom-1/4 left-1/4 w-16 h-16 border-2 border-purple-300/20 rounded-lg rotate-45 animate-float" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/3 left-1/5 w-12 h-12 border-2 border-pink-300/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* 页面标题 */}
          <div className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
          }`}>
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-semibold text-blue-700 mb-4 animate-pulse">
              探索练习模式
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                选择练习模式
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              根据你的需求，选择最适合的练习场景。我们的 AI
              教练会针对不同场景给你专业的反馈。
            </p>
          </div>

          {/* 模块卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MODULES.map((module, index) => (
              <div
                key={module.id}
                className={`transition-all duration-700 transform ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${300 + index * 150}ms` }}
              >
                <ModuleCardComponent
                  module={module}
                  onClick={() => handleCardClick(module)}
                />
              </div>
            ))}
          </div>

          {/* 底部提示 */}
          <div className={`mt-16 text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`} style={{ transitionDelay: '750ms' }}>
            <p className="text-gray-500 text-sm">
              更多练习模式正在开发中，敬请期待...
            </p>
            <Link
              href="/"
              className="group inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-purple-600 transition-all duration-300 font-medium"
            >
              <svg
                className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300"
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
              返回首页
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

/**
 * 模块卡片组件
 */
interface ModuleCardProps {
  module: ModuleCard;
  onClick: () => void;
}

function ModuleCardComponent({ module, onClick }: ModuleCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // 根据模块ID设置不同的渐变色
  const getGradientColors = (id: string) => {
    switch (id) {
      case 'self-intro':
        return {
          icon: 'from-blue-500 to-blue-600',
          button: 'from-blue-600 to-blue-700',
          glow: 'from-blue-600 to-blue-600',
          bg: 'from-blue-400/10 to-blue-600/10',
        };
      case 'interview':
        return {
          icon: 'from-purple-500 to-purple-600',
          button: 'from-purple-600 to-purple-700',
          glow: 'from-purple-600 to-purple-600',
          bg: 'from-purple-400/10 to-purple-600/10',
        };
      case 'ppt':
        return {
          icon: 'from-pink-500 to-pink-600',
          button: 'from-pink-600 to-pink-700',
          glow: 'from-pink-600 to-pink-600',
          bg: 'from-pink-400/10 to-pink-600/10',
        };
      default:
        return {
          icon: 'from-gray-400 to-gray-500',
          button: 'from-gray-600 to-gray-700',
          glow: 'from-gray-600 to-gray-600',
          bg: 'from-gray-400/10 to-gray-600/10',
        };
    }
  };

  const colors = getGradientColors(module.id);

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-100
        shadow-lg transition-all duration-300
        ${
          module.available
            ? 'hover:shadow-2xl hover:-translate-y-2 cursor-pointer'
            : 'opacity-75'
        }
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 卡片背景光晕 */}
      {module.available && (
        <div className={`absolute -inset-0.5 bg-gradient-to-r ${colors.glow} rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500`}></div>
      )}

      {/* 背景装饰 */}
      {module.available && (
        <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${colors.bg} rounded-full blur-2xl transform translate-x-20 -translate-y-20 group-hover:scale-150 transition-transform duration-500`}></div>
      )}

      {/* 不可用标签 */}
      {!module.available && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full z-10">
          即将推出
        </div>
      )}

      {/* 卡片内容 */}
      <div className="relative p-8">
        {/* 图标 */}
        <div
          className={`
            w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg
            transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300
            ${
              module.available
                ? `bg-gradient-to-br ${colors.icon}`
                : 'bg-gray-100'
            }
          `}
        >
          <span className={module.available ? 'filter drop-shadow-sm' : ''}>{module.icon}</span>
        </div>

        {/* 标题 */}
        <h3 className={`text-xl font-bold mb-3 transition-all duration-300 ${
          module.available
            ? 'text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text ' +
              (module.id === 'self-intro' ? 'group-hover:from-blue-600 group-hover:to-blue-700' :
               module.id === 'interview' ? 'group-hover:from-purple-600 group-hover:to-purple-700' :
               'group-hover:from-pink-600 group-hover:to-pink-700')
            : 'text-gray-500'
        }`}>
          {module.title}
        </h3>

        {/* 描述 */}
        <p className="text-gray-600 mb-6 leading-relaxed text-sm">
          {module.description}
        </p>

        {/* 功能列表 */}
        <ul className="space-y-2 mb-8">
          {module.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <svg
                className={`w-4 h-4 flex-shrink-0 ${
                  module.available ? 'text-green-500' : 'text-gray-400'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>

        {/* 按钮 */}
        {module.available ? (
          <button
            className={`group/btn relative w-full py-3 px-6 bg-gradient-to-r ${colors.button} text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden`}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <span className="relative z-10">{module.buttonText}</span>
            <svg
              className="relative z-10 w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300"
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
            <div className={`absolute inset-0 bg-gradient-to-r ${colors.button} opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 brightness-110`}></div>
          </button>
        ) : (
          <button
            disabled
            className="w-full py-3 px-6 bg-gray-100 text-gray-400 font-semibold rounded-xl cursor-not-allowed"
          >
            {module.buttonText}
          </button>
        )}

        {/* 底部装饰条 */}
        {module.available && (
          <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${colors.icon} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
        )}
      </div>
    </div>
  );
}
