"""
用户个性化档案服务
管理用户的说话习惯、历史记录等
"""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, List
from collections import Counter

from app.models.user_profile import (
    UserSpeakingProfile,
    PracticeRecord,
    PracticeType,
    UserProfileUpdate
)

# 用户档案数据文件路径
PROFILES_FILE = Path(__file__).parent.parent.parent / "data" / "user_profiles.json"


class UserProfileService:
    """用户档案服务类"""

    def __init__(self):
        # 确保数据目录存在
        PROFILES_FILE.parent.mkdir(parents=True, exist_ok=True)
        if not PROFILES_FILE.exists():
            PROFILES_FILE.write_text("{}")

    def _load_profiles(self) -> dict:
        """加载所有用户档案"""
        try:
            with open(PROFILES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return {}

    def _save_profiles(self, profiles: dict):
        """保存用户档案"""
        with open(PROFILES_FILE, "w", encoding="utf-8") as f:
            json.dump(profiles, f, ensure_ascii=False, indent=2, default=str)

    def get_user_profile(self, user_id: str) -> Optional[UserSpeakingProfile]:
        """获取用户档案"""
        profiles = self._load_profiles()
        profile_data = profiles.get(user_id)
        if profile_data:
            return UserSpeakingProfile(**profile_data)
        return None

    def create_user_profile(self, user_id: str) -> UserSpeakingProfile:
        """创建新用户档案"""
        profiles = self._load_profiles()

        if user_id in profiles:
            return UserSpeakingProfile(**profiles[user_id])

        profile = UserSpeakingProfile(
            user_id=user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        profiles[user_id] = profile.model_dump()
        self._save_profiles(profiles)
        return profile

    def add_practice_record(self, user_id: str, record: PracticeRecord) -> UserSpeakingProfile:
        """
        添加练习记录并更新用户档案
        会自动分析用户的说话习惯和进步趋势
        """
        profiles = self._load_profiles()

        # 获取或创建用户档案
        if user_id not in profiles:
            profile = self.create_user_profile(user_id)
        else:
            profile = UserSpeakingProfile(**profiles[user_id])

        # 更新统计数据
        profile.total_practices += 1
        profile.total_words += record.word_count
        profile.updated_at = datetime.utcnow()

        # 更新各类型练习计数
        if record.practice_type == PracticeType.INTERVIEW:
            profile.interview_count += 1
        elif record.practice_type == PracticeType.PPT:
            profile.ppt_count += 1
        elif record.practice_type == PracticeType.SELF_INTRO:
            profile.self_intro_count += 1

        # 添加到最近记录（保留最近10条）
        profile.recent_records.insert(0, record)
        profile.recent_records = profile.recent_records[:10]

        # 更新分数趋势（保留最近20次）
        profile.score_trend.append(record.overall_score)
        profile.score_trend = profile.score_trend[-20:]

        # 重新计算平均分
        profile.average_score = sum(profile.score_trend) / len(profile.score_trend)

        # 分析常见优点和弱点
        profile = self._analyze_speaking_patterns(profile)

        # 分析语速
        profile = self._analyze_speaking_pace(profile)

        # 保存更新后的档案
        profiles[user_id] = profile.model_dump()
        self._save_profiles(profiles)

        return profile

    def _analyze_speaking_patterns(self, profile: UserSpeakingProfile) -> UserSpeakingProfile:
        """
        分析用户的说话模式，总结常见优点和弱点
        """
        if len(profile.recent_records) < 2:
            return profile

        # 收集所有优点和弱点
        all_strengths = []
        all_weaknesses = []

        for record in profile.recent_records:
            all_strengths.extend(record.strengths)
            all_weaknesses.extend(record.improvements)

        # 统计出现频率最高的优点和弱点
        strength_counter = Counter(all_strengths)
        weakness_counter = Counter(all_weaknesses)

        # 取前5个最常见的
        profile.common_strengths = [s for s, _ in strength_counter.most_common(5)]
        profile.common_weaknesses = [w for w, _ in weakness_counter.most_common(5)]

        # 确定改进重点（出现3次以上的弱点）
        profile.improvement_areas = [
            weakness for weakness, count in weakness_counter.items()
            if count >= 3
        ]

        return profile

    def _analyze_speaking_pace(self, profile: UserSpeakingProfile) -> UserSpeakingProfile:
        """
        分析用户的语速
        """
        if len(profile.recent_records) < 3:
            return profile

        # 计算平均每分钟字数
        valid_records = [r for r in profile.recent_records if r.duration and r.duration > 0]
        if not valid_records:
            return profile

        words_per_minute = [
            (r.word_count / r.duration) * 60
            for r in valid_records
        ]
        avg_wpm = sum(words_per_minute) / len(words_per_minute)

        # 根据中文语速标准分类
        # 中文正常语速：150-200字/分钟
        if avg_wpm < 120:
            profile.speaking_pace = "较慢"
        elif avg_wpm < 200:
            profile.speaking_pace = "正常"
        else:
            profile.speaking_pace = "较快"

        return profile

    def get_personalized_context(self, user_id: str) -> str:
        """
        获取用户的个性化上下文，用于AI提示词
        这样AI就能根据用户的历史习惯给出针对性建议
        """
        profile = self.get_user_profile(user_id)
        if not profile or profile.total_practices == 0:
            return "这是该用户的第一次练习。"

        context_parts = [
            f"用户档案：已完成{profile.total_practices}次练习，平均分{profile.average_score:.1f}分。"
        ]

        # 添加常见优点
        if profile.common_strengths:
            strengths_str = "、".join(profile.common_strengths[:3])
            context_parts.append(f"该用户的常见优点：{strengths_str}。")

        # 添加常见弱点
        if profile.common_weaknesses:
            weaknesses_str = "、".join(profile.common_weaknesses[:3])
            context_parts.append(f"该用户常见的问题：{weaknesses_str}。")

        # 添加改进重点
        if profile.improvement_areas:
            areas_str = "、".join(profile.improvement_areas[:2])
            context_parts.append(f"重点改进方向：{areas_str}。")

        # 添加语速信息
        if profile.speaking_pace:
            context_parts.append(f"语速：{profile.speaking_pace}。")

        # 添加进步趋势
        if len(profile.score_trend) >= 5:
            recent_avg = sum(profile.score_trend[-3:]) / 3
            older_avg = sum(profile.score_trend[-6:-3]) / 3
            if recent_avg > older_avg + 5:
                context_parts.append("用户最近进步明显，给予鼓励。")
            elif recent_avg < older_avg - 5:
                context_parts.append("用户最近表现有所下降，需要额外支持。")

        return "\n".join(context_parts)


# 全局用户档案服务实例
user_profile_service = UserProfileService()
