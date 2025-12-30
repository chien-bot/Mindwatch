"""
认证工具函数
"""

from typing import Optional
from fastapi import Header, HTTPException, status
from app.core.security import decode_access_token
import logging

logger = logging.getLogger(__name__)


def get_current_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    从请求头中获取当前用户ID
    如果没有token或token无效，返回None（允许匿名访问）
    """
    if not authorization:
        logger.debug("No authorization header")
        return None

    try:
        # 提取 Bearer token
        if not authorization.startswith("Bearer "):
            logger.debug(f"Invalid authorization format: {authorization[:20]}")
            return None

        token = authorization.replace("Bearer ", "")
        payload = decode_access_token(token)

        if not payload:
            logger.debug("Failed to decode token")
            return None

        user_id = payload.get("user_id")
        logger.debug(f"Decoded user_id: {user_id}")
        return user_id
    except Exception as e:
        logger.error(f"Error in get_current_user_id: {str(e)}")
        return None


def require_auth(authorization: Optional[str] = Header(None)) -> str:
    """
    要求必须认证，如果没有token或token无效，抛出401错误
    """
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="需要登录",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id
