/**
 * 页脚组件
 * 显示在首页底部，包含版权信息和链接
 */

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* 品牌信息 */}
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
            >
              SpeakMate
            </Link>
            <p className="mt-2 text-sm">AI 口语教练 - 让表达更自信</p>
          </div>

          {/* 链接 */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="/product"
              className="hover:text-white transition-colors"
            >
              产品功能
            </Link>
            <a href="#" className="hover:text-white transition-colors">
              使用帮助
            </a>
            <a href="#" className="hover:text-white transition-colors">
              隐私政策
            </a>
            <a href="#" className="hover:text-white transition-colors">
              联系我们
            </a>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} SpeakMate. Made for students to
            practice speaking with confidence.
          </p>
        </div>
      </div>
    </footer>
  );
}
