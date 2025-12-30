"""
用户服务：处理用户注册、登录、查询等
"""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict
from app.models.user import User, UserCreate
from app.core.security import get_password_hash, verify_password

# 用户数据文件路径
USERS_FILE = Path(__file__).parent.parent.parent / "data" / "users.json"


class UserService:
    """用户服务类"""

    def __init__(self):
        # 确保数据目录存在
        USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
        if not USERS_FILE.exists():
            USERS_FILE.write_text("{}")

    def _load_users(self) -> Dict[str, dict]:
        """加载所有用户"""
        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return {}

    def _save_users(self, users: Dict[str, dict]):
        """保存用户数据"""
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, ensure_ascii=False, indent=2, default=str)

    def get_user_by_email(self, email: str) -> Optional[User]:
        """根据邮箱获取用户"""
        users = self._load_users()
        for user_data in users.values():
            if user_data.get("email") == email:
                return User(**user_data)
        return None

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """根据 ID 获取用户"""
        users = self._load_users()
        user_data = users.get(user_id)
        if user_data:
            return User(**user_data)
        return None

    def create_user(self, user_create: UserCreate) -> User:
        """创建新用户"""
        users = self._load_users()

        # 检查邮箱是否已存在
        if self.get_user_by_email(user_create.email):
            raise ValueError("邮箱已被注册")

        # 检查用户名是否已存在
        for user_data in users.values():
            if user_data.get("username") == user_create.username:
                raise ValueError("用户名已被使用")

        # 创建新用户
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            username=user_create.username,
            email=user_create.email,
            hashed_password=get_password_hash(user_create.password),
            full_name=user_create.full_name,
            created_at=datetime.utcnow(),
            is_active=True
        )

        # 保存用户
        users[user_id] = user.model_dump()
        self._save_users(users)

        return user

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """验证用户登录"""
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user


# 全局用户服务实例
user_service = UserService()
