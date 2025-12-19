/**
 * 模式选择器组件
 * 允许用户在 PPT、面试、自我介绍三种模式间切换
 */

import React from 'react';
import { ModeType, MODE_CONFIGS } from '@/types/chat';

interface ModeSelectorProps {
  currentMode: ModeType;
  onModeChange: (mode: ModeType) => void;
}

// 模式图标映射
const MODE_ICONS: Record<ModeType, string> = {
  ppt: '📊',
  interview: '💼',
  self_intro: '👋',
};

export default function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-gray-700">
        选择练习模式 <span className="text-gray-400">· 点击切换</span>
      </h3>
      <div className="flex flex-wrap gap-3">
        {MODE_CONFIGS.map((config) => (
          <button
            key={config.value}
            onClick={() => onModeChange(config.value)}
            className={`
              relative px-5 py-3 rounded-xl font-medium transition-all duration-200
              hover:shadow-xl active:scale-95
              ${
                currentMode === config.value
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
              }
            `}
          >
            <div className="flex items-center gap-3">
              {/* 图标 */}
              <span className="text-2xl">{MODE_ICONS[config.value]}</span>

              {/* 文本 */}
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-base font-semibold">{config.label}</span>
                <span
                  className={`text-xs ${
                    currentMode === config.value ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {config.description}
                </span>
              </div>

              {/* 选中标记 */}
              {currentMode === config.value && (
                <svg
                  className="w-5 h-5 ml-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
