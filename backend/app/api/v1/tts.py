"""
文字转语音 (TTS) API 接口
将 AI 的文字反馈转换为语音
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from app.core.llm_client import synthesize_speech
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class TTSRequest(BaseModel):
    """TTS 请求模型"""
    text: str


@router.post("/tts")
async def text_to_speech(request: TTSRequest) -> Response:
    """
    将文字转换为语音

    Args:
        request: 包含要转换的文字

    Returns:
        音频文件（MP3 格式）
    """
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="文本内容不能为空")

        # 文本长度限制（OpenAI TTS 限制为 4096 字符）
        if len(request.text) > 4096:
            raise HTTPException(
                status_code=400,
                detail="文本长度超过限制（最大 4096 字符）"
            )

        logger.info(f"TTS 请求: {request.text[:50]}...")

        # 调用 TTS API
        audio_content = await synthesize_speech(request.text)

        # 返回音频文件
        return Response(
            content=audio_content,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=speech.mp3"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS 生成失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"语音生成失败: {str(e)}")
