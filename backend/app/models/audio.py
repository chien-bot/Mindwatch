"""
音频相关的数据模型
用于音频上传接口的请求和响应
"""

from pydantic import BaseModel, Field


class AudioTranscriptionResponse(BaseModel):
    """音频转写响应模型"""

    transcript: str = Field(..., description="转写的文本内容")
    reply: str = Field(..., description="AI 教练的反馈")
    demo_text: str = Field(default="", description="AI 示范文本（用于 TTS）")
    mode: str = Field(default="self_intro", description="当前模式")

    class Config:
        json_schema_extra = {
            "example": {
                "transcript": "大家好，我叫小明，目前是高中二年级学生...",
                "reply": "很好的开场!让我给你一些改进建议...",
                "demo_text": "大家好，我是小明，目前就读于某某高中二年级...",
                "mode": "self_intro",
            }
        }
