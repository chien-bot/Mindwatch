/**
 * PPT 示范讲解区域组件
 * 显示AI生成的示范讲解话术，并支持语音播放
 */

import React, { useState, useRef } from 'react';
import { SlideContent, synthesizeSpeech } from '@/lib/api';

interface PPTDemoSectionProps {
  slides: SlideContent[];
}

export default function PPTDemoSection({ slides }: PPTDemoSectionProps) {
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSlide = slides[selectedSlide];

  // 播放示范语音
  const handlePlayDemo = async () => {
    if (!currentSlide.demo_script) return;

    try {
      setIsPlaying(true);

      // 如果还没有生成音频，先生成
      if (!audioUrl) {
        const url = await synthesizeSpeech(currentSlide.demo_script);
        setAudioUrl(url);

        // 创建音频元素并播放
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
        };

        audio.onerror = () => {
          setIsPlaying(false);
          alert('播放失败，请重试');
        };

        await audio.play();
      } else {
        // 已有音频，直接播放
        if (audioRef.current) {
          audioRef.current.onended = () => setIsPlaying(false);
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

  // 切换幻灯片
  const handleSlideChange = (index: number) => {
    // 停止当前播放
    handleStopDemo();
    // 清除音频URL，让下一页重新生成
    setAudioUrl(null);
    setSelectedSlide(index);
  };

  return (
    <div className="mt-8 p-6 bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/30 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white">
          🎯 AI 示范讲解
        </h3>
      </div>

      <p className="text-sm text-gray-300 mb-4">
        AI 已经为每一页 PPT 生成了示范讲解话术，你可以先听听AI是怎么讲的！
      </p>

      {/* 幻灯片选择器 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.slide_number}
            onClick={() => handleSlideChange(index)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedSlide === index
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            第 {slide.slide_number} 页
          </button>
        ))}
      </div>

      {/* 示范话术显示 */}
      {currentSlide.demo_script ? (
        <div className="space-y-4">
          {/* 播放按钮 */}
          <div className="flex justify-center">
            <button
              onClick={isPlaying ? handleStopDemo : handlePlayDemo}
              disabled={isPlaying}
              className={`
                flex items-center gap-3 px-6 py-3 rounded-xl font-semibold shadow-lg
                transition-all duration-200
                ${
                  isPlaying
                    ? 'bg-gray-500 text-gray-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-xl hover:shadow-purple-500/50 active:scale-95'
                }
              `}
            >
              {isPlaying ? (
                <>
                  <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                  </svg>
                  <span>播放中...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  <span>听 AI 示范讲解</span>
                </>
              )}
            </button>
          </div>

          {/* 示范文本（可展开） */}
          <details className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <summary className="text-sm text-white cursor-pointer hover:text-gray-100 font-medium">
              📄 查看示范讲解文本
            </summary>
            <div className="mt-3 p-4 bg-gray-900/50 rounded-lg text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {currentSlide.demo_script}
            </div>
          </details>

          {/* 提示 */}
          <div className="flex items-start gap-2 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-white">
              💡 建议：先听 AI 的示范讲解，学习如何组织语言和表达节奏，然后再开始自己的演讲练习。
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>这一页暂无示范讲解</p>
        </div>
      )}
    </div>
  );
}
