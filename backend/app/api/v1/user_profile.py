"""
用户档案 API
查看用户的练习历史和说话习惯分析
"""

from fastapi import APIRouter, HTTPException, Header, status, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.core.auth_utils import require_auth, get_current_user_id
from app.services.user_profile_service import user_profile_service
from app.models.user_profile import UserSpeakingProfile, PracticeRecord

router = APIRouter()


@router.get("/profile", response_model=UserSpeakingProfile)
async def get_my_profile(user_id: str = Depends(require_auth)):
    """
    获取当前用户的个性化档案

    包括：
    - 总体练习统计
    - 说话习惯分析
    - 常见优点和弱点
    - 最近练习记录
    - 分数趋势
    """

    # 获取或创建用户档案
    profile = user_profile_service.get_user_profile(user_id)
    if not profile:
        profile = user_profile_service.create_user_profile(user_id)

    return profile


@router.get("/profile/history", response_model=List[PracticeRecord])
async def get_practice_history(
    limit: int = 20,
    user_id: str = Depends(require_auth)
):
    """
    获取用户的练习历史记录

    参数：
    - limit: 返回的记录数量（默认20条）
    """

    profile = user_profile_service.get_user_profile(user_id)
    if not profile:
        return []

    # 返回最近的记录
    return profile.recent_records[:limit]


class ProfileSummary(BaseModel):
    """档案摘要"""
    total_practices: int
    average_score: float
    interview_count: int
    ppt_count: int
    self_intro_count: int
    common_strengths: List[str]
    common_weaknesses: List[str]
    speaking_pace: Optional[str]


@router.get("/profile/summary", response_model=ProfileSummary)
async def get_profile_summary(user_id: str = Depends(require_auth)):
    """
    获取用户档案摘要（简化版）

    适合在首页显示用户的整体表现
    """

    profile = user_profile_service.get_user_profile(user_id)
    if not profile:
        # 返回空档案
        return ProfileSummary(
            total_practices=0,
            average_score=0.0,
            interview_count=0,
            ppt_count=0,
            self_intro_count=0,
            common_strengths=[],
            common_weaknesses=[],
            speaking_pace=None
        )

    return ProfileSummary(
        total_practices=profile.total_practices,
        average_score=profile.average_score,
        interview_count=profile.interview_count,
        ppt_count=profile.ppt_count,
        self_intro_count=profile.self_intro_count,
        common_strengths=profile.common_strengths,
        common_weaknesses=profile.common_weaknesses,
        speaking_pace=profile.speaking_pace
    )
