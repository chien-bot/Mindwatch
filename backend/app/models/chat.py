"""
聊天相关的数据模型
使用 Pydantic 进行数据验证
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field


# 定义模式类型
ModeType = Literal["ppt", "interview", "self_intro"]


class Message(BaseModel):
    """单条消息模型"""

    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    """聊天请求模型"""

    mode: ModeType = Field(..., description="练习模式: ppt, interview, self_intro")
    message: str = Field(..., min_length=1, description="用户输入的消息")
    history: Optional[List[Message]] = Field(
        default=None, description="对话历史(可选,用于保持上下文)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "mode": "ppt",
                "message": "今天我想和大家分享一下我们团队的项目进展...",
                "history": [
                    {"role": "user", "content": "你好"},
                    {"role": "assistant", "content": "你好!我是你的演讲教练..."},
                ],
            }
        }


class ChatResponse(BaseModel):
    """聊天响应模型"""

    reply: str = Field(..., description="AI 的回复内容")
    mode: ModeType = Field(..., description="当前模式")
    debug_prompt: Optional[str] = Field(
        default=None, description="调试信息: 使用的 system prompt(可选)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "reply": "很好的开场!让我给你一些建议...",
                "mode": "ppt",
                "debug_prompt": "你是一位温和但专业的演讲教练...",
            }
        }
