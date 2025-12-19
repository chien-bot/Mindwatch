/**
 * 消息列表组件
 * 显示对话历史,包括用户消息和 AI 回复
 */

import React, { useEffect, useRef, useState } from 'react';
import { Message } from '@/types/chat';
import { synthesizeSpeech } from '@/lib/api';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export default function MessageList({ messages, isLoading = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 mt-10">
          <p className="text-lg mb-2">👋 你好!</p>
          <p>选择一个模式,开始练习吧!</p>
        </div>
      )}

      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}

      {isLoading && <LoadingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
}

/**
 * 单条消息气泡
 */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 播放示范语音
  const handlePlayDemo = async () => {
    if (!message.demoText) return;

    try {
      setIsPlaying(true);

      // 如果还没有生成音频，先生成
      if (!audioUrl) {
        const url = await synthesizeSpeech(message.demoText);
        setAudioUrl(url);

        // 创建音频元素并播放
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          alert('播放失败，请重试');
        };

        await audio.play();
      } else {
        // 已有音频，直接播放
        if (audioRef.current) {
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('播放示范失败:', error);
      setIsPlaying(false);
      alert('播放失败，请重试');
    }
  };

  // 停止播放
  const handleStopDemo = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div
      className={`message-bubble flex ${isUser ? 'justify-end' : 'justify-start'} px-2`}
    >
      <div
        className={`
          max-w-[80%] px-5 py-3 rounded-2xl
          ${
            isUser
              ? 'message-user text-white rounded-br-sm'
              : 'message-assistant text-gray-800 rounded-bl-sm'
          }
        `}
      >
        {/* 如果是 AI 消息,支持 markdown 格式(简化版,保留换行和加粗) */}
        {isUser ? (
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        ) : (
          <>
            <div className="prose prose-sm max-w-none">
              {formatAIMessage(message.content)}
            </div>

            {/* 示范语音播放按钮 */}
            {message.demoText && (
              <div className="mt-4 pt-3 border-t border-blue-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <span className="text-lg">🎯</span>
                    <span className="font-medium">AI 示范</span>
                  </div>
                  <button
                    onClick={isPlaying ? handleStopDemo : handlePlayDemo}
                    disabled={isPlaying}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg
                      transition-all duration-200
                      ${
                        isPlaying
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                      }
                    `}
                  >
                    {isPlaying ? (
                      <>
                        <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                        </svg>
                        <span className="text-sm">播放中...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                        <span className="text-sm font-medium">听示范</span>
                      </>
                    )}
                  </button>
                </div>
                {/* 示范文本（可展开查看） */}
                <details className="mt-2">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                    查看示范文本
                  </summary>
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                    {message.demoText}
                  </div>
                </details>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 加载指示器
 */
function LoadingIndicator() {
  return (
    <div className="flex justify-start message-bubble px-2">
      <div className="message-assistant px-5 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full loading-dot" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full loading-dot" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full loading-dot" style={{ animationDelay: '0.4s' }}></div>
          <span className="text-sm text-gray-500 ml-2">思考中...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 格式化 AI 消息
 * 简单处理 markdown 格式:换行、加粗、标题等
 */
function formatAIMessage(content: string) {
  // 按行分割
  const lines = content.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        // 处理加粗 **text**
        const boldRegex = /\*\*(.+?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push(
              <span key={`text-${index}-${lastIndex}`}>
                {line.substring(lastIndex, match.index)}
              </span>
            );
          }
          parts.push(
            <strong key={`bold-${index}-${match.index}`} className="font-bold text-gray-900">
              {match[1]}
            </strong>
          );
          lastIndex = match.index + match[0].length;
        }

        if (lastIndex < line.length) {
          parts.push(
            <span key={`text-${index}-${lastIndex}`}>
              {line.substring(lastIndex)}
            </span>
          );
        }

        // 如果行是空的,返回一个空行
        if (line.trim() === '') {
          return <div key={index} className="h-2"></div>;
        }

        // 如果行以数字开头(列表项),添加缩进
        if (/^\d+\./.test(line.trim())) {
          return (
            <div key={index} className="ml-2">
              {parts.length > 0 ? parts : line}
            </div>
          );
        }

        return (
          <div key={index} className="whitespace-pre-wrap break-words">
            {parts.length > 0 ? parts : line}
          </div>
        );
      })}
    </div>
  );
}
