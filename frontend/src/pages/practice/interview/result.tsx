/**
 * 面试结果分析页面
 * 显示 AI 对面试的分析和建议
 */

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

// 岗位映射
const POSITION_MAP: { [key: string]: string } = {
  frontend: '前端工程师',
  backend: '后端工程师',
  product: '产品经理',
  designer: 'UI/UX 设计师',
  data: '数据分析师',
  marketing: '市场营销',
};

export default function InterviewResultPage() {
  const router = useRouter();
  const { position, duration } = router.query;

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const positionName = POSITION_MAP[position as string] || '未知岗位';
  const callDuration = duration ? parseInt(duration as string) : 0;

  useEffect(() => {
    // 模拟 AI 分析过程
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult(getMockAnalysis(position as string));
    }, 3000);

    return () => clearTimeout(timer);
  }, [position]);

  /**
   * 获取 Mock 分析结果
   */
  const getMockAnalysis = (pos: string) => {
    return `## 整体表现评分：82/100

### 优点 ✅

1. **自我介绍清晰**：能够简洁明了地介绍自己的背景和经验
2. **专业知识扎实**：对${positionName}领域的核心概念理解较好
3. **表达流畅**：语言组织能力较强，表达逻辑清晰
4. **举例得当**：用实际案例支撑观点，增强说服力

### 需要改进 📈

1. **回答深度**：部分问题回答较为表面，缺乏深入分析
2. **STAR 法则**：建议使用 Situation-Task-Action-Result 结构化回答
3. **停顿控制**：适当的停顿可以让回答更有节奏感
4. **细节补充**：可以增加更多量化数据和具体细节

### 具体建议 💡

#### 技术深度
- 在回答技术问题时，可以从原理、实践、优化三个层面展开
- 补充更多实际项目中遇到的挑战和解决方案
- 关注行业最新技术趋势和最佳实践

#### 表达技巧
- **结构化思维**：先总后分，论点+论据的方式组织答案
- **举例说明**：每个观点至少配一个具体案例
- **量化成果**：用数据说话（如"性能提升30%"比"性能有所提升"更有力）

#### 下次重点练习 🎯

1. 准备3-5个核心项目案例，用 STAR 法则梳理
2. 针对${positionName}岗位，深入学习1-2个技术难点
3. 练习在2-3分钟内讲清楚一个复杂问题
4. 准备几个反问面试官的好问题

### 推荐资源 📚

- **面试技巧**：《Cracking the Coding Interview》
- **STAR 法则**：搜索"STAR 面试法"相关教程
- **行业资讯**：关注相关技术博客和社区

继续加油！每一次练习都是进步的机会！💪`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <>
      <Head>
        <title>面试分析报告 - SpeakMate</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
        {/* 顶部导航 */}
        <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/practice/interview"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors font-medium group"
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
              重新开始
            </Link>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-50"></div>
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                面试分析报告
              </h1>
            </div>

            <div className="w-24"></div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* 面试信息卡片 */}
          <div className="mb-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{positionName}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    面试时长: {formatDuration(callDuration)}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date().toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl shadow-xl">
                💼
              </div>
            </div>
          </div>

          {/* AI 分析结果 */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">AI 智能分析</h2>
            </div>

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
                <p className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  AI 正在分析你的面试表现...
                </p>
                <p className="text-sm text-gray-400">这可能需要几秒钟</p>

                <div className="mt-8 w-full max-w-md">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>分析进度</span>
                    <span>85%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse w-[85%] shadow-lg shadow-blue-500/50"></div>
                  </div>
                </div>
              </div>
            ) : (
              // 分析结果
              <div className="prose prose-invert max-w-none">
                <div className="mb-6 p-4 bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl border-l-4 border-green-500 backdrop-blur-sm">
                  <p className="text-green-400 font-semibold flex items-center gap-2 m-0">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    分析完成！
                  </p>
                </div>

                <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">{analysisResult}</div>

                {/* 操作按钮 */}
                <div className="mt-8 flex gap-4 not-prose">
                  <Link
                    href="/practice/interview"
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:-translate-y-0.5 text-center"
                  >
                    再练一次
                  </Link>
                  <Link
                    href="/product"
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl shadow-lg transition-all text-center transform hover:-translate-y-0.5"
                  >
                    返回首页
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
