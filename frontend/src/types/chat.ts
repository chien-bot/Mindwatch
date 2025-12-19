/**
 * 聊天相关的 TypeScript 类型定义
 */

// 模式类型
export type ModeType = 'ppt' | 'interview' | 'self_intro';

// 消息角色
export type MessageRole = 'user' | 'assistant' | 'system';

// 单条消息
export interface Message {
  role: MessageRole;
  content: string;
  demoText?: string; // AI 示范文本（仅 assistant 消息）
}

// 聊天请求
export interface ChatRequest {
  mode: ModeType;
  message: string;
  history?: Message[];
}

// 聊天响应
export interface ChatResponse {
  reply: string;
  mode: ModeType;
  debug_prompt?: string;
}

// 模式配置(用于 UI 显示)
export interface ModeConfig {
  value: ModeType;
  label: string;
  description: string;
  color: string;
}

// 预定义的模式配置
export const MODE_CONFIGS: ModeConfig[] = [
  {
    value: 'ppt',
    label: 'PPT 演讲',
    description: '练习演讲和报告表达',
    color: 'bg-blue-500',
  },
  {
    value: 'interview',
    label: '面试模拟',
    description: '模拟面试官,练习面试回答',
    color: 'bg-green-500',
  },
  {
    value: 'self_intro',
    label: '自我介绍',
    description: '优化自我介绍表达',
    color: 'bg-purple-500',
  },
];
