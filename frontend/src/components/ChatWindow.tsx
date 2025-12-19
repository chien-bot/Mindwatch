/**
 * 聊天窗口主容器组件
 * 组合所有子组件,管理聊天状态和逻辑
 *
 * 支持两种使用方式：
 * 1. 独立使用（带模式选择器）：直接 <ChatWindow />
 * 2. 固定模式（隐藏模式选择器）：<ChatWindow fixedMode="self_intro" />
 */

import React, { useState, useEffect } from 'react';
import { ModeType, Message } from '@/types/chat';
import { sendChatMessage } from '@/lib/api';
import ModeSelector from './ModeSelector';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import SelfIntroLivePanel from './SelfIntroLivePanel';

// 组件属性接口
interface ChatWindowProps {
  /** 固定模式：传入后隐藏 ModeSelector，直接使用该模式 */
  fixedMode?: ModeType;
  /** 是否显示完整 header（包含标题和模式选择器） */
  showHeader?: boolean;
}

export default function ChatWindow({ fixedMode, showHeader = true }: ChatWindowProps) {
  // 状态管理
  // 如果有 fixedMode，使用它作为初始值；否则默认 ppt
  const [internalMode, setInternalMode] = useState<ModeType>(fixedMode || 'ppt');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 实际使用的 mode：优先使用 fixedMode
  const mode = fixedMode || internalMode;

  // 当 fixedMode 改变时，更新内部状态
  useEffect(() => {
    if (fixedMode) {
      setInternalMode(fixedMode);
    }
  }, [fixedMode]);

  /**
   * 处理模式切换（仅在非 fixedMode 时生效）
   */
  const handleModeChange = (newMode: ModeType) => {
    if (fixedMode) return; // 固定模式下不允许切换

    setInternalMode(newMode);
    // 切换模式时清空对话,开始新的会话
    setMessages([]);
    setError(null);
  };

  /**
   * 处理发送消息
   */
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    // 添加用户消息到列表
    const userMessage: Message = {
      role: 'user',
      content: messageText,
    };
    setMessages((prev) => [...prev, userMessage]);
    setError(null);
    setIsLoading(true);

    try {
      // 调用后端 API
      const response = await sendChatMessage({
        mode,
        message: messageText,
        history: messages.slice(-10), // 只发送最近 10 条消息作为上下文
      });

      // 添加 AI 回复到列表
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('发送消息失败:', err);
      setError(err instanceof Error ? err.message : '发送消息失败,请重试');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理录音转写结果
   * 从 Live 练习区收到转写文本和 AI 反馈后，添加到聊天记录
   */
  const handleTranscriptReceived = (transcript: string, reply: string, demoText: string) => {
    // 添加用户消息（转写的文本）
    const userMessage: Message = {
      role: 'user',
      content: transcript,
    };

    // 添加 AI 回复
    const assistantMessage: Message = {
      role: 'assistant',
      content: reply,
      demoText: demoText || undefined, // 只在有示范文本时添加
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
  };

  // 是否显示完整 header（只在非 fixedMode 且 showHeader 为 true 时显示）
  const shouldShowHeader = !fixedMode && showHeader;

  return (
    <div className={`flex flex-col ${fixedMode ? 'h-full' : 'h-screen'} max-w-7xl mx-auto bg-white shadow-2xl`}>
      {/* 顶部区域 - 仅在非 fixedMode 时显示完整 header */}
      {shouldShowHeader && (
        <header className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              SpeakMate
            </h1>
            <p className="text-sm text-gray-600">AI 口语教练 - 让表达更自信</p>
          </div>

          <ModeSelector currentMode={mode} onModeChange={handleModeChange} />
        </header>
      )}

      {/* 主内容区域 - 根据模式切换布局 */}
      {mode === 'self_intro' ? (
        // 自我介绍模式：两列布局（Live 练习区 + 聊天区）
        <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden self-intro-layout">
          {/* 左侧：Live 练习区 */}
          <div className="w-full md:w-2/5 flex-shrink-0 h-[400px] md:h-auto">
            <SelfIntroLivePanel onTranscriptReceived={handleTranscriptReceived} />
          </div>

          {/* 右侧：聊天区 */}
          <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl shadow-lg overflow-hidden">
            <MessageList messages={messages} isLoading={isLoading} />

            {/* 错误提示 */}
            {error && (
              <div className="mx-4 mb-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <strong>错误:</strong> {error}
              </div>
            )}

            <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      ) : (
        // 其他模式：原始单列布局
        <>
          <MessageList messages={messages} isLoading={isLoading} />

          {/* 错误提示 */}
          {error && (
            <div className="mx-4 mb-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <strong>错误:</strong> {error}
            </div>
          )}

          <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </>
      )}
    </div>
  );
}
