/**
 * 面试岗位选择页
 * 用户选择要面试的岗位类型
 */

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

// 岗位选项
interface JobPosition {
  id: string;
  title: string;
  icon: string;
  description: string;
  commonQuestions: string[];
}

const JOB_POSITIONS: JobPosition[] = [
  {
    id: 'frontend',
    title: '前端工程师',
    icon: '💻',
    description: 'Frontend Developer',
    commonQuestions: [
      '介绍一下你最近的项目经验',
      '如何优化网页性能？',
      '熟悉哪些前端框架？',
    ],
  },
  {
    id: 'backend',
    title: '后端工程师',
    icon: '⚙️',
    description: 'Backend Developer',
    commonQuestions: [
      '数据库设计经验如何？',
      '如何处理高并发场景？',
      '熟悉哪些后端技术栈？',
    ],
  },
  {
    id: 'product',
    title: '产品经理',
    icon: '📱',
    description: 'Product Manager',
    commonQuestions: [
      '如何进行需求分析？',
      '如何平衡用户需求和技术实现？',
      '描述一个成功的产品案例',
    ],
  },
  {
    id: 'designer',
    title: 'UI/UX 设计师',
    icon: '🎨',
    description: 'UI/UX Designer',
    commonQuestions: [
      '设计流程是怎样的？',
      '如何平衡美观和可用性？',
      '熟悉哪些设计工具？',
    ],
  },
  {
    id: 'data',
    title: '数据分析师',
    icon: '📊',
    description: 'Data Analyst',
    commonQuestions: [
      '熟悉哪些数据分析工具？',
      '如何从数据中提取洞察？',
      '描述一个数据分析项目',
    ],
  },
  {
    id: 'marketing',
    title: '市场营销',
    icon: '📢',
    description: 'Marketing Specialist',
    commonQuestions: [
      '如何制定营销策略？',
      '如何衡量营销效果？',
      '熟悉哪些营销渠道？',
    ],
  },
];

export default function InterviewPage() {
  const router = useRouter();
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  const handleStartInterview = () => {
    if (selectedPosition) {
      router.push(`/practice/interview/call?position=${selectedPosition}`);
    }
  };

  const selectedJob = JOB_POSITIONS.find((job) => job.id === selectedPosition);

  return (
    <>
      <Head>
        <title>面试模拟 - SpeakMate</title>
        <meta name="description" content="选择岗位，开始 AI 模拟面试" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* 顶部导航 */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/product"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium group"
            >
              <svg
                className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
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

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-50"></div>
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                  <span className="text-xl">💼</span>
                </div>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI 面试模拟
              </h1>
            </div>

            <div className="w-24"></div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              选择你要面试的岗位
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              选择一个岗位，AI 面试官会通过语音通话的形式与你进行模拟面试
            </p>
          </div>

          {/* 岗位网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {JOB_POSITIONS.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedPosition(job.id)}
                className={`
                  relative p-6 rounded-2xl transition-all duration-300 text-left
                  ${
                    selectedPosition === job.id
                      ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-500 shadow-xl shadow-blue-500/20'
                      : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg'
                  }
                  transform hover:-translate-y-1
                `}
              >
                {/* 选中标记 */}
                {selectedPosition === job.id && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
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
                  </div>
                )}

                {/* 图标 */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-3xl mb-4 border border-white/10">
                  {job.icon}
                </div>

                {/* 标题 */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{job.description}</p>

                {/* 常见问题预览 */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-semibold">常见问题示例：</p>
                  {job.commonQuestions.slice(0, 2).map((question, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <svg
                        className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs text-gray-600">{question}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* 选中岗位信息和开始按钮 */}
          {selectedJob && (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-4xl shadow-xl">
                  {selectedJob.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedJob.title}
                  </h3>
                  <p className="text-gray-600">{selectedJob.description}</p>
                </div>
              </div>

              {/* 面试说明 */}
              <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">面试须知</h4>
                </div>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    这是一场语音通话形式的模拟面试
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    AI 面试官会针对 {selectedJob.title} 岗位提出专业问题
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    请保持安静的环境，确保麦克风权限已开启
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    面试结束后会获得详细的 AI 分析报告
                  </li>
                </ul>
              </div>

              {/* 开始面试按钮 */}
              <button
                onClick={handleStartInterview}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
              >
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
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                开始语音面试
              </button>
            </div>
          )}

          {/* 未选择提示 */}
          {!selectedPosition && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 border border-white/10 mb-4">
                <svg
                  className="w-8 h-8 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                  />
                </svg>
              </div>
              <p className="text-gray-600">请先选择一个岗位</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
