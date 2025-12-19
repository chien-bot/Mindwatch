"""
聊天 API 路由
处理用户消息,调用 LLM,返回 AI 回复
"""

from fastapi import APIRouter, HTTPException
from app.models.chat import ChatRequest, ChatResponse, Message
from app.prompts import get_system_prompt
from app.core.llm_client import llm_client
from app.core.config import settings

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    聊天接口

    接收用户消息和模式,返回 AI 回复

    Args:
        request: ChatRequest 对象,包含 mode、message 和可选的 history

    Returns:
        ChatResponse 对象,包含 AI 的回复

    Raises:
        HTTPException: 当模式不支持或处理出错时
    """
    try:
        # 1. 获取对应模式的 system prompt
        system_prompt = get_system_prompt(request.mode)

        # 2. 构建消息列表
        messages = [Message(role="system", content=system_prompt)]

        # 3. 添加历史对话(如果有)
        if request.history:
            # 只保留最近的 10 条对话,避免上下文过长
            recent_history = request.history[-10:]
            messages.extend(recent_history)

        # 4. 添加当前用户消息
        messages.append(Message(role="user", content=request.message))

        # 5. 调用 LLM 获取回复
        reply = await llm_client.call_llm(messages)

        # 6. 构建响应
        response = ChatResponse(
            reply=reply,
            mode=request.mode,
            debug_prompt=system_prompt if settings.DEBUG else None,
        )

        return response

    except ValueError as e:
        # 模式不存在
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # 其他错误
        raise HTTPException(status_code=500, detail=f"处理请求时出错: {str(e)}")


@router.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "use_mock_llm": settings.USE_MOCK_LLM,
    }
