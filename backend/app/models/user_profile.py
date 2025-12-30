"""
用户个性化档案模型
记录用户的说话习惯、历史表现等
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum


class PracticeType(str, Enum):
    """练习类型"""
    INTERVIEW = "interview"
    PPT = "ppt"
    SELF_INTRO = "self_intro"


class PracticeRecord(BaseModel):
    """单次练习记录"""
    id: str
    user_id: str
    practice_type: PracticeType
    timestamp: datetime
    transcript: str  # 用户说的话
    duration: Optional[float] = None  # 说话时长（秒）
    word_count: int = 0  # 字数
    overall_score: int  # 总分

    # 具体评分项
    content_score: Optional[int] = None  # 内容得分
    fluency_score: Optional[int] = None  # 流畅度得分
    clarity_score: Optional[int] = None  # 清晰度得分

    # AI反馈
    strengths: List[str] = []  # 优点
    improvements: List[str] = []  # 需要改进

    # 额外信息
    metadata: Dict = {}  # 如面试问题、PPT主题等


class UserSpeakingProfile(BaseModel):
    """用户说话习惯档案"""
    user_id: str
    created_at: datetime
    updated_at: datetime

    # 总体统计
    total_practices: int = 0
    total_words: int = 0
    average_score: float = 0.0

    # 说话习惯分析
    common_strengths: List[str] = []  # 常见优点（从历史记录中总结）
    common_weaknesses: List[str] = []  # 常见弱点
    speaking_pace: Optional[str] = None  # 语速：slow/normal/fast
    vocabulary_level: Optional[str] = None  # 词汇水平：basic/intermediate/advanced

    # 个性化特征
    speaking_style: Optional[str] = None  # 说话风格描述
    improvement_areas: List[str] = []  # 重点改进方向

    # 最近练习记录（保留最近10条）
    recent_records: List[PracticeRecord] = []

    # 各类型练习统计
    interview_count: int = 0
    ppt_count: int = 0
    self_intro_count: int = 0

    # 进步趋势
    score_trend: List[int] = []  # 最近的分数趋势


class UserProfileUpdate(BaseModel):
    """更新用户档案的数据"""
    practice_record: PracticeRecord
