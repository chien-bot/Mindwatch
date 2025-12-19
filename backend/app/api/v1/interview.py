"""
AI 面试对话 API
支持多轮语音对话和最终评价
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from app.models.chat import Message
from app.prompts import get_system_prompt
from app.core.llm_client import llm_client, transcribe_audio, synthesize_speech
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class InterviewStartRequest(BaseModel):
    """开始面试请求"""
    position: str  # 岗位ID (frontend, backend, etc.)


class InterviewStartResponse(BaseModel):
    """开始面试响应"""
    session_id: str
    first_question: str
    first_question_audio_required: bool = True  # 前端需要调用 TTS


class InterviewAnswerRequest(BaseModel):
    """用户回答请求"""
    session_id: str
    audio_data: Optional[str] = None  # Base64 编码的音频（如果用语音）
    text_answer: Optional[str] = None  # 或直接文字回答
    conversation_history: List[dict]  # 对话历史


class InterviewAnswerResponse(BaseModel):
    """AI 响应"""
    next_question: Optional[str] = None  # 下一个问题（None 表示面试结束）
    is_finished: bool = False
    final_feedback: Optional[str] = None  # 面试结束时的总评


# 简单的会话存储（生产环境应该用 Redis）
interview_sessions = {}


@router.post("/interview/start", response_model=InterviewStartResponse)
async def start_interview(request: InterviewStartRequest):
    """
    开始面试

    返回第一个问题和会话ID
    """
    try:
        import uuid
        session_id = str(uuid.uuid4())

        # 获取面试 system prompt
        system_prompt = get_system_prompt("interview")

        # 生成第一个问题（必须是自我介绍）
        messages = [
            Message(role="system", content=system_prompt),
            Message(role="user", content=f"我来面试 {request.position} 岗位，请开始。")
        ]

        first_question = await llm_client.call_llm(messages)

        # 存储会话
        interview_sessions[session_id] = {
            "position": request.position,
            "messages": messages + [Message(role="assistant", content=first_question)],
            "question_count": 1
        }

        logger.info(f"面试开始: session={session_id}, position={request.position}")

        return InterviewStartResponse(
            session_id=session_id,
            first_question=first_question
        )

    except Exception as e:
        logger.error(f"开始面试失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"开始面试失败: {str(e)}")


@router.post("/interview/answer", response_model=InterviewAnswerResponse)
async def submit_answer(request: InterviewAnswerRequest):
    """
    提交用户回答，获取 AI 的下一个问题或最终评价
    """
    try:
        # 获取会话
        session = interview_sessions.get(request.session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

        # 处理用户回答（如果是音频，先转文字）
        user_answer = request.text_answer
        if not user_answer and request.audio_data:
            # TODO: 将 base64 音频转为 bytes，然后调用 ASR
            # audio_bytes = base64.b64decode(request.audio_data)
            # user_answer = await transcribe_audio(audio_bytes)
            raise HTTPException(status_code=400, detail="音频回答功能开发中，请使用文字回答")

        if not user_answer:
            raise HTTPException(status_code=400, detail="请提供回答内容")

        logger.info(f"收到回答: session={request.session_id}, answer={user_answer[:50]}...")

        # 添加用户消息到历史
        session["messages"].append(Message(role="user", content=user_answer))

        # 判断是否继续提问还是结束
        # question_count 表示当前已问的问题数（包括刚回答的这个）
        question_count = session["question_count"]
        max_questions = 4  # 共 4 个问题

        # 用户回答完第 4 个问题后才结束
        if question_count >= max_questions:
            # 面试结束，生成总评
            final_system_prompt = """面试已结束。你现在是面试教练，要给候选人总体评价。

【最重要的规则】绝对禁止再问任何问题！不能有问号！不能有"你觉得呢"、"怎么样"、"想不想"这类疑问句！

【输出格式】请严格按照以下结构回复：

第一部分 - 总体评价：
用2-3句话总结候选人的整体表现，比如"整体来说你的表达还是比较清晰的"、"你对技术的理解还不错"等。

第二部分 - 改进建议：
针对候选人回答中不够好的地方，直接示范应该怎么说。格式是：
"比如刚才你说[原话]，其实可以这样说会更好：[示范的更好说法]"

第三部分 - 鼓励：
用1-2句话鼓励候选人，比如"继续加油"、"多练习几次就会更自然了"等。

【示范回复】
整体来说，你的表达比较有条理，对技术也有一定的理解。不过有些地方可以说得更具体一些。比如刚才你说"我做过一些项目"，其实可以这样说会更好："我主导开发过一个用户管理系统，用了三个月时间，主要负责后端接口设计"。这样面试官就能更清楚地了解你的经验。总的来说表现不错，多练习几次会更自然的，加油！

【再次提醒】
- 不要问任何问题！
- 不要用问号！
- 只给评价、示范、鼓励！
- 用口语表达，这会被语音播放！"""
            session["messages"][0] = Message(role="system", content=final_system_prompt)
            final_feedback = await llm_client.call_llm(session["messages"])

            logger.info(f"面试结束: session={request.session_id}")

            return InterviewAnswerResponse(
                is_finished=True,
                final_feedback=final_feedback
            )
        else:
            # 继续提问
            next_question = await llm_client.call_llm(session["messages"])
            session["messages"].append(Message(role="assistant", content=next_question))
            session["question_count"] += 1

            return InterviewAnswerResponse(
                next_question=next_question,
                is_finished=False
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"处理回答失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")


@router.get("/interview/session/{session_id}")
async def get_session_info(session_id: str):
    """获取会话信息（调试用）"""
    session = interview_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="会话不存在")

    return {
        "session_id": session_id,
        "position": session["position"],
        "question_count": session["question_count"],
        "message_count": len(session["messages"])
    }


@router.post("/interview/answer/audio")
async def submit_audio_answer(
    file: UploadFile = File(..., description="录制的音频文件"),
    session_id: str = Form(..., description="面试会话ID")
):
    """
    上传音频回答，自动转写并返回转写文本

    注意：这个接口只返回转写结果，不进行面试逻辑处理
    前端需要拿到 transcript 后再调用 /interview/answer 接口
    """
    try:
        # 验证会话存在
        session = interview_sessions.get(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")

        # 读取音频内容
        audio_content = await file.read()
        file_size_mb = len(audio_content) / (1024 * 1024)

        logger.info(f"收到面试音频: session={session_id}, 大小={file_size_mb:.2f}MB")

        # 调用 ASR 转写
        transcript = await transcribe_audio(audio_content, file.filename or "audio.webm")

        logger.info(f"转写成功: {transcript[:50]}...")

        return {
            "transcript": transcript,
            "session_id": session_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"音频转写失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"音频处理失败: {str(e)}")
