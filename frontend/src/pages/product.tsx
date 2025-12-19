/**
 * Product 产品页
 * 展示 3 个练习模块卡片，用户可以选择进入不同的练习模式
 */

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

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

  const handleCardClick = (module: ModuleCard) => {
    if (module.available) {
      router.push(module.href);
    }
  };

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
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              选择练习模式
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              根据你的需求，选择最适合的练习场景。我们的 AI
              教练会针对不同场景给你专业的反馈。
            </p>
          </div>

          {/* 模块卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MODULES.map((module) => (
              <ModuleCardComponent
                key={module.id}
                module={module}
                onClick={() => handleCardClick(module)}
              />
            ))}
          </div>

          {/* 底部提示 */}
          <div className="mt-16 text-center">
            <p className="text-gray-500 text-sm">
              更多练习模式正在开发中，敬请期待...
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-purple-600 transition-colors font-medium"
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
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl bg-white border border-gray-100
        shadow-lg transition-all duration-300
        ${
          module.available
            ? 'hover:shadow-2xl hover:-translate-y-1 cursor-pointer'
            : 'opacity-75'
        }
      `}
      onClick={onClick}
    >
      {/* 不可用标签 */}
      {!module.available && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
          即将推出
        </div>
      )}

      {/* 卡片内容 */}
      <div className="p-8">
        {/* 图标 */}
        <div
          className={`
            w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6
            ${
              module.available
                ? 'bg-gradient-to-br from-blue-100 to-purple-100'
                : 'bg-gray-100'
            }
          `}
        >
          {module.icon}
        </div>

        {/* 标题 */}
        <h3 className="text-xl font-bold text-gray-900 mb-3">{module.title}</h3>

        {/* 描述 */}
        <p className="text-gray-600 mb-6 leading-relaxed">
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
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {module.buttonText}
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        ) : (
          <button
            disabled
            className="w-full py-3 px-6 bg-gray-100 text-gray-400 font-semibold rounded-xl cursor-not-allowed"
          >
            {module.buttonText}
          </button>
        )}
      </div>

      {/* 可用卡片的装饰边框 */}
      {module.available && (
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent hover:border-blue-200 transition-colors pointer-events-none"></div>
      )}
    </div>
  );
}
