"""
PPT 相关的数据模型
"""

from pydantic import BaseModel
from typing import List, Optional


class SlideContent(BaseModel):
    """单张幻灯片内容"""
    slide_number: int  # 幻灯片编号（从 1 开始）
    image_url: str  # 幻灯片图片 URL
    text_content: str  # 幻灯片文字内容
    demo_script: Optional[str] = None  # AI 示范讲解话术（可选）


class PPTUploadResponse(BaseModel):
    """PPT 上传响应"""
    presentation_id: str  # PPT 演示文稿 ID
    total_slides: int  # 总页数
    slides: List[SlideContent]  # 所有幻灯片内容


class SlideAnalysisRequest(BaseModel):
    """幻灯片分析请求"""
    presentation_id: str  # PPT 演示文稿 ID
    slide_number: int  # 当前幻灯片编号
    slide_text: str  # 幻灯片文字内容
    transcript: str  # 用户讲解的转写文本


class SlideAnalysisResponse(BaseModel):
    """幻灯片分析响应"""
    slide_number: int  # 幻灯片编号
    feedback: str  # AI 反馈内容
    suggestions: List[str]  # 具体建议列表
    score: Optional[int] = None  # 评分（0-100，可选）


class VideoAnalysisResponse(BaseModel):
    """视频分析响应"""
    presentation_id: str  # PPT 演示文稿 ID
    transcript: str  # 完整转写文本
    overall_score: int  # 总体评分（0-100）
    overall_feedback: str  # 总体反馈
    strengths: List[str]  # 优点列表
    improvements: List[str]  # 需要改进的地方
    demo_script: str  # AI 示范讲解（如何更好地讲解这个 PPT）
    suggestions: List[str]  # 具体建议
