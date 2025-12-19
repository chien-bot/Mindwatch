"""
FastAPI 应用主入口
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.v1 import chat, self_intro_audio, ppt, tts, interview
from pathlib import Path

# 创建 FastAPI 应用实例
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI 口语教练后端服务 - 帮助用户练习演讲、面试和自我介绍",
)

# 配置 CORS - 允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,  # 允许的源
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有 HTTP 方法
    allow_headers=["*"],  # 允许所有 HTTP 头
)

# 创建静态文件目录（如果不存在）
static_dir = Path(settings.STATIC_DIR)
static_dir.mkdir(exist_ok=True)

# 挂载静态文件目录
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# 注册 API 路由
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(
    self_intro_audio.router, prefix="/api/v1", tags=["self_intro", "audio"]
)
app.include_router(ppt.router, prefix="/api/v1/ppt", tags=["ppt"])
app.include_router(tts.router, prefix="/api/v1", tags=["tts"])
app.include_router(interview.router, prefix="/api/v1", tags=["interview"])


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": f"Welcome to {settings.APP_NAME}!",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/health")
async def health():
    """全局健康检查"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


if __name__ == "__main__":
    import uvicorn

    # 开发模式下直接运行
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # 开发时自动重载
    )
