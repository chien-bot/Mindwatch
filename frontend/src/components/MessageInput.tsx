/**
 * 消息输入组件
 * 文本输入框 + 发送按钮
 */

import React, { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    const trimmedMessage = inputValue.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setInputValue(''); // 清空输入框
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enter 换行,Enter 发送
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4">
      <div className="flex gap-3 items-end">
        {/* 输入框 */}
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入你的消息... (Enter 发送,Shift+Enter 换行)"
          disabled={disabled}
          rows={3}
          className="
            flex-1 px-4 py-3 rounded-lg border border-gray-300
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            resize-none disabled:bg-gray-100 disabled:cursor-not-allowed
            text-gray-800
          "
        />

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={disabled || !inputValue.trim()}
          className="
            px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
            hover:bg-blue-700 active:bg-blue-800
            disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors duration-200
            flex items-center gap-2
          "
        >
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
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
          发送
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        提示: 按 Enter 发送消息,Shift + Enter 换行
      </p>
    </div>
  );
}
