"""
自我介绍音频上传接口
处理用户录制的音频，转写成文本，并返回 AI 反馈
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.audio import AudioTranscriptionResponse
from app.models.chat import Message
from app.prompts import get_system_prompt
from app.core.llm_client import llm_client, transcribe_audio
import logging

router = APIRouter()

logger = logging.getLogger(__name__)


@router.post("/self_intro/audio", response_model=AudioTranscriptionResponse)
async def upload_self_intro_audio(
    file: UploadFile = File(..., description="录制的音频文件")
) -> AudioTranscriptionResponse:
    """
    处理自我介绍音频上传

    流程:
    1. 接收音频文件
    2. 转写成文本 (TODO: 接入真实 ASR API)
    3. 调用 LLM 获取反馈
    4. 返回转写文本 + AI 反馈

    Args:
        file: 用户上传的音频文件

    Returns:
        AudioTranscriptionResponse: 包含转写文本和 AI 反馈
    """
    try:
        # 验证文件类型
        if not file.content_type or not file.content_type.startswith("audio/"):
            # 也接受一些常见的音频格式
            allowed_types = ["audio/", "video/webm", "video/mp4"]
            if not any(file.content_type.startswith(t) for t in allowed_types):
                raise HTTPException(
                    status_code=400,
                    detail=f"不支持的文件类型: {file.content_type}. 请上传音频文件。",
                )

        # 读取文件内容（暂时不使用，但验证文件可读）
        audio_content = await file.read()
        file_size_mb = len(audio_content) / (1024 * 1024)

        logger.info(
            f"收到音频文件: {file.filename}, "
            f"类型: {file.content_type}, "
            f"大小: {file_size_mb:.2f}MB"
        )

        # 调用语音识别 API（根据 USE_MOCK_LLM 配置自动切换 mock/真实）
        transcript_text = await transcribe_audio(audio_content, file.filename or "audio.webm")

        logger.info(f"转写结果: {transcript_text[:50]}...")

        # 调用 LLM 获取自我介绍反馈
        ai_reply, demo_text = await get_self_intro_feedback(transcript_text)

        return AudioTranscriptionResponse(
            transcript=transcript_text,
            reply=ai_reply,
            demo_text=demo_text,
            mode="self_intro"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"处理音频时出错: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"处理音频失败: {str(e)}")


async def get_self_intro_feedback(user_text: str) -> tuple[str, str]:
    """
    获取自我介绍的 AI 反馈，并提取示范文本

    Args:
        user_text: 用户的自我介绍文本

    Returns:
        tuple[str, str]: (AI 教练的反馈文本, 示范文本)
    """
    # 获取 self_intro 模式的 system prompt
    system_prompt = get_system_prompt("self_intro")

    # 构建消息列表
    messages = [
        Message(role="system", content=system_prompt),
        Message(role="user", content=user_text),
    ]

    # 调用 LLM
    reply = await llm_client.call_llm(messages)

    # 提取示范文本（在引号内的文本）
    demo_text = extract_demo_text(reply)

    return reply, demo_text


def extract_demo_text(ai_response: str) -> str:
    """
    从 AI 响应中提取示范文本

    提取规则：
    1. 查找 "你可以这样说：" 或 "直接示范" 后面引号内的文本
    2. 如果找不到，返回空字符串

    Args:
        ai_response: AI 的完整响应

    Returns:
        提取出的示范文本
    """
    import re

    # 尝试匹配引号内的内容
    patterns = [
        r'"([^"]+)"',  # 双引号
        r'"([^"]+)"',  # 中文引号
        r'「([^」]+)」',  # 日文引号
    ]

    for pattern in patterns:
        matches = re.findall(pattern, ai_response)
        if matches:
            # 返回最长的匹配（通常是完整的示范文本）
            longest_match = max(matches, key=len)
            if len(longest_match) > 20:  # 至少 20 个字符才算有效示范
                return longest_match.strip()

    # 如果没找到引号，尝试提取 "你可以这样说：" 后的段落
    patterns_fallback = [
        r'你可以这样说[：:]\s*\n\n([^\n]+(?:\n[^\n]+)*?)(?:\n\n|\*\*|$)',
        r'直接示范[：:]\s*\n\n([^\n]+(?:\n[^\n]+)*?)(?:\n\n|\*\*|$)',
    ]

    for pattern in patterns_fallback:
        match = re.search(pattern, ai_response)
        if match:
            return match.group(1).strip()

    logger.warning("未能从 AI 响应中提取示范文本")
    return ""
