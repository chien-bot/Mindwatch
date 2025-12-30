"""
配置管理模块
使用 pydantic-settings 管理环境变量和应用配置
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """应用配置类"""

    # 应用基础信息
    APP_NAME: str = "SpeakMate"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # 安全配置
    SECRET_KEY: str = "your-secret-key-change-in-production-please-use-a-random-string"

    # CORS 配置
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001"

    # LLM 配置
    USE_MOCK_LLM: bool = True  # 是否使用 mock LLM（开发阶段设为 True）
    USE_OPENSOURCE: bool = True  # 是否使用开源方案（Ollama + edge-tts + whisper）

    # OpenAI API 配置（付费方案）
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4-turbo-preview"

    # Ollama 配置（开源方案）
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:3b"  # 轻量级模型，适合 8GB 内存

    # ASR 配置
    ASR_API_KEY: str = ""  # OpenAI Whisper API Key（付费）
    WHISPER_MODEL: str = "tiny"  # 本地 Whisper 模型：tiny/base/small（8GB 推荐 tiny 或 base）

    # TTS 配置
    TTS_API_KEY: str = ""  # OpenAI TTS API Key（付费）
    EDGE_TTS_VOICE: str = "zh-CN-XiaoxiaoNeural"  # edge-tts 中文语音

    # 文件存储配置
    UPLOAD_DIR: str = "uploads"  # 上传文件存储目录
    STATIC_DIR: str = "static"  # 静态文件（转换后的图片）存储目录

    @property
    def cors_origins_list(self) -> List[str]:
        """将 CORS origins 字符串转为列表"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# 创建全局配置实例
settings = Settings()
