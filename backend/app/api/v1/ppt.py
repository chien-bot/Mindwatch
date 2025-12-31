"""
PPT 演讲练习相关 API
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Header
from fastapi.staticfiles import StaticFiles
from app.models.ppt import PPTUploadResponse, SlideContent, SlideAnalysisRequest, SlideAnalysisResponse, VideoAnalysisResponse
from app.models.user_profile import PracticeRecord, PracticeType
from app.core.llm_client import llm_client, analyze_slide_with_vision, synthesize_speech, generate_slide_demo_script, transcribe_audio
from app.models.chat import Message
from app.core.config import settings
from app.core.auth_utils import get_current_user_id
from app.services.ppt_processor import PPTProcessor, get_file_type
from app.services.user_profile_service import user_profile_service
from typing import List, Optional
from pathlib import Path
from datetime import datetime
import uuid
import os
import shutil
import logging
import subprocess
import tempfile

logger = logging.getLogger(__name__)

router = APIRouter()

# 临时存储 PPT 信息（生产环境应使用数据库）
ppt_storage = {}


@router.post("/upload", response_model=PPTUploadResponse)
async def upload_ppt(file: UploadFile = File(...)):
    """
    上传 PPT 文件并解析为图片

    功能：
    - 支持 PDF、PPT、PPTX 格式
    - 将每页转换为 PNG 图片
    - 提取文本内容
    """

    # 验证文件类型
    allowed_types = [
        "application/pdf",
        "application/vnd.ms-powerpoint",  # .ppt
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"  # .pptx
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="仅支持 PDF、PPT、PPTX 格式的文件"
        )

    # 验证文件大小（最大 50MB）
    content = await file.read()
    file_size = len(content)

    if file_size > 50 * 1024 * 1024:  # 50MB
        raise HTTPException(
            status_code=400,
            detail="文件大小不能超过 50MB"
        )

    # 生成唯一的演示文稿 ID
    presentation_id = str(uuid.uuid4())

    # 创建上传和输出目录
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(exist_ok=True)

    static_dir = Path(settings.STATIC_DIR) / presentation_id
    static_dir.mkdir(parents=True, exist_ok=True)

    # 保存上传的文件
    file_ext = get_file_type(file.filename)
    upload_path = upload_dir / f"{presentation_id}.{file_ext}"

    with open(upload_path, "wb") as f:
        f.write(content)

    try:
        # 使用 PPTProcessor 处理文件
        processor = PPTProcessor(output_dir=str(static_dir))
        results = processor.process_file(str(upload_path), file_ext)

        # 构建幻灯片数据
        slides = []
        for idx, (image_path, text_content) in enumerate(results):
            slide_number = idx + 1
            # 生成图片 URL（相对路径）
            image_url = f"/static/{presentation_id}/slide_{slide_number}.png"

            slides.append(SlideContent(
                slide_number=slide_number,
                image_url=image_url,
                text_content=text_content
            ))

        # 为每一页生成 AI 示范讲解话术（并行生成以提高速度）
        logger.info(f"开始为 {len(slides)} 页幻灯片生成示范讲解（并行处理）...")

        async def generate_demo_for_slide(slide: SlideContent) -> tuple[int, str]:
            """为单个幻灯片生成示范讲解"""
            try:
                slide_image_path = static_dir / f"slide_{slide.slide_number}.png"
                demo_script = await generate_slide_demo_script(
                    slide_number=slide.slide_number,
                    slide_text=slide.text_content,
                    slide_image_path=str(slide_image_path) if slide_image_path.exists() else None
                )
                logger.info(f"第 {slide.slide_number} 页示范生成完成: {len(demo_script)} 字符")
                return (slide.slide_number, demo_script)
            except Exception as e:
                logger.error(f"第 {slide.slide_number} 页示范生成失败: {str(e)}")
                # 生成失败时使用简单示范
                fallback = f"大家好，请看第 {slide.slide_number} 页。{slide.text_content[:100] if slide.text_content else '这页展示了重要内容'}。"
                return (slide.slide_number, fallback)

        # 并行生成所有页面的示范讲解
        import asyncio
        import time
        start_time = time.time()
        demo_results = await asyncio.gather(*[generate_demo_for_slide(slide) for slide in slides])
        end_time = time.time()

        # 将生成的示范话术赋值给对应的幻灯片
        for slide_number, demo_script in demo_results:
            for slide in slides:
                if slide.slide_number == slide_number:
                    slide.demo_script = demo_script
                    break

        logger.info(f"并行生成完成！总耗时: {end_time - start_time:.2f} 秒，平均每页: {(end_time - start_time) / len(slides):.2f} 秒")

        # 存储到内存（生产环境应存储到数据库）
        ppt_storage[presentation_id] = {
            "filename": file.filename,
            "slides": slides,
            "upload_path": str(upload_path),
            "static_dir": str(static_dir)
        }

        logger.info(f"PPT 上传完成: {len(slides)} 页，全部生成示范讲解")

        return PPTUploadResponse(
            presentation_id=presentation_id,
            total_slides=len(slides),
            slides=slides
        )

    except Exception as e:
        # 清理文件
        if upload_path.exists():
            os.remove(upload_path)
        if static_dir.exists():
            shutil.rmtree(static_dir)

        # 记录详细错误信息
        import traceback
        error_msg = f"PPT upload error: {type(e).__name__}"
        error_details = traceback.format_exc()

        # 打印到控制台（确保可见）
        print("=" * 80)
        print(error_msg)
        print("=" * 80)
        print(error_details)
        print("=" * 80)

        logger.error(error_msg)
        logger.error(f"Error details: {error_details}")

        raise HTTPException(
            status_code=500,
            detail=f"File processing failed: {str(e)}"
        )


@router.post("/analyze-slide", response_model=SlideAnalysisResponse)
async def analyze_slide(request: SlideAnalysisRequest):
    """
    分析用户对某一页幻灯片的讲解（使用 Vision API）

    功能：
    - 使用 GPT-4 Vision 识别幻灯片内容（图片、图表、文字）
    - 对比幻灯片内容和用户讲解
    - 给出"示范教学法"的反馈（直接示范如何讲解）
    - 提供 PPT 内容优化建议
    """
    try:
        # 验证演示文稿是否存在
        if request.presentation_id not in ppt_storage:
            raise HTTPException(
                status_code=404,
                detail="演示文稿不存在"
            )

        ppt_data = ppt_storage[request.presentation_id]

        # 获取对应的幻灯片信息
        slide = None
        for s in ppt_data["slides"]:
            if s.slide_number == request.slide_number:
                slide = s
                break

        if not slide:
            raise HTTPException(
                status_code=404,
                detail=f"幻灯片 {request.slide_number} 不存在"
            )

        # 构建幻灯片图片的本地路径
        static_dir = Path(ppt_data["static_dir"])
        slide_image_path = static_dir / f"slide_{request.slide_number}.png"

        if not slide_image_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"幻灯片图片文件不存在: {slide_image_path}"
            )

        logger.info(f"分析幻灯片: presentation_id={request.presentation_id}, "
                   f"slide_number={request.slide_number}, "
                   f"image_path={slide_image_path}")

        # 使用 Vision API 分析幻灯片和用户讲解
        vision_feedback = await analyze_slide_with_vision(
            slide_image_url=str(slide_image_path),
            user_transcript=request.transcript,
            slide_number=request.slide_number,
            slide_text=slide.text_content
        )

        logger.info(f"Vision 分析完成: {len(vision_feedback)} 字符")

        # 提取建议
        suggestions = extract_suggestions_from_feedback(vision_feedback)

        # Mock 评分（可以让 LLM 在响应中包含评分）
        score = 80

        return SlideAnalysisResponse(
            slide_number=request.slide_number,
            feedback=vision_feedback,
            suggestions=suggestions,
            score=score
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"分析幻灯片失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"分析失败: {str(e)}"
        )


def mock_convert_ppt_to_slides(filename: str) -> List[SlideContent]:
    """
    Mock 函数：模拟将 PPT 转换为幻灯片数据

    真实实现需要：
    1. 使用 pdf2image 或 LibreOffice 将 PPT 转为图片
    2. 使用 OCR 或 PDF 文本提取提取文字
    """

    # 返回示例数据
    return [
        SlideContent(
            slide_number=1,
            image_url="https://via.placeholder.com/800x600/3B82F6/FFFFFF?text=Slide+1:+Introduction",
            text_content="项目介绍\\n本次演讲将介绍我们的新产品设计方案。"
        ),
        SlideContent(
            slide_number=2,
            image_url="https://via.placeholder.com/800x600/8B5CF6/FFFFFF?text=Slide+2:+Market+Analysis",
            text_content="市场分析\\n当前市场存在以下痛点：\\n1. 用户体验不佳\\n2. 价格过高\\n3. 功能单一"
        ),
        SlideContent(
            slide_number=3,
            image_url="https://via.placeholder.com/800x600/EC4899/FFFFFF?text=Slide+3:+Solution",
            text_content="解决方案\\n我们的产品通过以下方式解决问题：\\n• 优化用户界面\\n• 降低成本\\n• 增加功能模块"
        ),
        SlideContent(
            slide_number=4,
            image_url="https://via.placeholder.com/800x600/10B981/FFFFFF?text=Slide+4:+Roadmap",
            text_content="产品路线图\\nQ1: 原型设计\\nQ2: 开发测试\\nQ3: 市场推广\\nQ4: 正式发布"
        ),
    ]


@router.post("/generate-demo-speech")
async def generate_demo_speech(request: SlideAnalysisRequest):
    """
    为指定幻灯片生成 AI 示范讲解语音

    功能：
    - 先分析幻灯片内容（Vision API）
    - 生成示范讲解话术
    - 将话术转为语音（TTS）
    - 返回音频 URL
    """
    try:
        # 验证演示文稿是否存在
        if request.presentation_id not in ppt_storage:
            raise HTTPException(
                status_code=404,
                detail="演示文稿不存在"
            )

        ppt_data = ppt_storage[request.presentation_id]

        # 获取对应的幻灯片信息
        slide = None
        for s in ppt_data["slides"]:
            if s.slide_number == request.slide_number:
                slide = s
                break

        if not slide:
            raise HTTPException(
                status_code=404,
                detail=f"幻灯片 {request.slide_number} 不存在"
            )

        # 构建幻灯片图片的本地路径
        static_dir = Path(ppt_data["static_dir"])
        slide_image_path = static_dir / f"slide_{request.slide_number}.png"

        logger.info(f"生成示范语音: presentation_id={request.presentation_id}, "
                   f"slide_number={request.slide_number}")

        # 使用 Vision API 生成示范话术
        demo_prompt = f"""请为第 {request.slide_number} 页幻灯片生成一段30-60秒的示范讲解话术。

要求：
1. 语言自然流畅，像真人在讲话
2. 结构清晰（开场-内容-过渡）
3. 覆盖幻灯片的核心要点
4. 不要包含任何格式化符号（如**、##等），只返回纯文本

请直接返回示范话术，不要加任何说明。"""

        # 调用 Vision API
        demo_script = await analyze_slide_with_vision(
            slide_image_url=str(slide_image_path),
            user_transcript=demo_prompt,
            slide_number=request.slide_number,
            slide_text=slide.text_content
        )

        # 提取纯文本（去除 Markdown 格式）
        demo_text = extract_demo_script(demo_script)

        logger.info(f"示范话术生成: {len(demo_text)} 字符")

        # 生成语音
        audio_content = await synthesize_speech(demo_text)

        # 保存音频文件
        audio_filename = f"demo_slide_{request.slide_number}_{uuid.uuid4().hex[:8]}.mp3"
        audio_path = static_dir / audio_filename

        with open(audio_path, "wb") as f:
            f.write(audio_content)

        # 返回音频 URL
        audio_url = f"/static/{request.presentation_id}/{audio_filename}"

        logger.info(f"示范语音生成完成: {audio_url}")

        return {
            "slide_number": request.slide_number,
            "demo_script": demo_text,
            "audio_url": audio_url
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成示范语音失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"生成失败: {str(e)}"
        )


def extract_demo_script(text: str) -> str:
    """
    从 AI 返回的文本中提取纯示范话术

    去除 Markdown 格式和说明文字
    """
    import re

    # 移除 Markdown 格式符号
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # **粗体**
    text = re.sub(r'\*(.+?)\*', r'\1', text)      # *斜体*
    text = re.sub(r'`(.+?)`', r'\1', text)        # `代码`
    text = re.sub(r'#{1,6}\s+', '', text)         # # 标题

    # 尝试提取引号中的示范话术
    if '"' in text:
        matches = re.findall(r'"([^"]+)"', text)
        if matches:
            # 取最长的引用
            return max(matches, key=len).strip()

    # 如果没有引号，返回清理后的文本
    lines = text.split('\n')
    clean_lines = []
    for line in lines:
        line = line.strip()
        # 过滤掉明显的标题和说明性文字
        if line and not line.startswith('**') and not line.startswith('#'):
            if len(line) > 15:  # 过滤太短的行
                clean_lines.append(line)

    return '\n'.join(clean_lines[:10])  # 最多取前 10 行


def extract_suggestions_from_feedback(feedback: str) -> List[str]:
    """
    从 LLM 反馈中提取建议列表

    简化版：查找数字列表或 bullet points
    """
    suggestions = []
    lines = feedback.split('\n')

    for line in lines:
        line = line.strip()
        # 查找以数字或 bullet point 开头的行
        if line and (
            line[0].isdigit() or
            line.startswith('•') or
            line.startswith('-') or
            line.startswith('*')
        ):
            # 移除数字、bullet point 和空格
            clean_line = line.lstrip('0123456789.•-* ').strip()
            if clean_line and len(clean_line) > 10:  # 过滤太短的行
                suggestions.append(clean_line)

    # 如果没有找到，返回默认建议
    if not suggestions:
        suggestions = [
            "尝试放慢语速，让听众更容易理解",
            "可以加入一些具体的例子或数据支撑你的观点",
            "注意段落之间的过渡，使逻辑更连贯"
        ]

    return suggestions[:5]  # 最多返回 5 条建议


@router.post("/analyze-video", response_model=VideoAnalysisResponse)
async def analyze_presentation_video(
    file: UploadFile = File(...),
    presentation_id: str = Form(...),
    authorization: Optional[str] = Header(None)
):
    """
    分析用户上传的 PPT 演讲视频

    功能：
    1. 接收视频文件
    2. 提取音频并转写为文字
    3. AI 分析用户的讲解表现
    4. 给出改进建议
    5. 生成 AI 示范讲解
    """
    try:
        # 验证演示文稿是否存在
        if presentation_id not in ppt_storage:
            raise HTTPException(
                status_code=404,
                detail="演示文稿不存在"
            )

        ppt_data = ppt_storage[presentation_id]
        slides = ppt_data["slides"]
        static_dir = Path(ppt_data["static_dir"])

        logger.info(f"开始分析视频: presentation_id={presentation_id}")

        # 1. 保存上传的视频
        video_content = await file.read()
        video_filename = f"presentation_{uuid.uuid4().hex[:8]}.webm"
        video_path = static_dir / video_filename

        with open(video_path, "wb") as f:
            f.write(video_content)

        logger.info(f"视频已保存: {video_path}, 大小: {len(video_content)} bytes")

        # 2. 从视频提取音频
        audio_path = static_dir / f"presentation_{uuid.uuid4().hex[:8]}.wav"

        try:
            # 使用 ffmpeg 提取音频（使用完整路径以确保能找到）
            ffmpeg_path = '/opt/homebrew/bin/ffmpeg'
            # 如果完整路径不存在，尝试使用 which 查找
            import shutil
            if not os.path.exists(ffmpeg_path):
                ffmpeg_path = shutil.which('ffmpeg') or 'ffmpeg'

            subprocess.run([
                ffmpeg_path,
                '-y',  # 覆盖输出文件
                '-i', str(video_path),
                '-vn',  # 不要视频
                '-acodec', 'pcm_s16le',  # 音频编码
                '-ar', '16000',  # 采样率
                '-ac', '1',  # 单声道
                str(audio_path)
            ], check=True, capture_output=True)

            logger.info(f"音频提取完成: {audio_path}")

        except subprocess.CalledProcessError as e:
            logger.error(f"ffmpeg 提取音频失败: {e.stderr.decode()}")
            raise HTTPException(
                status_code=500,
                detail="视频处理失败，请确保视频格式正确"
            )

        # 3. 使用 ASR 转写音频
        with open(audio_path, "rb") as f:
            audio_content = f.read()

        transcript = await transcribe_audio(audio_content, audio_path.name)
        logger.info(f"音频转写完成: {len(transcript)} 字符")

        # 检查是否有实际语音内容
        if len(transcript.strip()) < 10:
            logger.warning("未检测到有效语音内容")
            return VideoAnalysisResponse(
                presentation_id=presentation_id,
                transcript="",
                overall_score=0,
                overall_feedback="系统未能检测到您的语音内容。这可能是因为：1) 录制时没有说话；2) 麦克风未开启或音量太低；3) 视频文件没有音频轨道。请检查录制设备并重新尝试。",
                strengths=[],
                improvements=[
                    "未检测到语音内容，请确保录制时有说话",
                    "请检查麦克风是否正常工作",
                    "建议重新录制并确保音量适中"
                ],
                demo_script="",  # 空字符串而不是 None
                suggestions=[
                    "确保浏览器已授权麦克风权限",
                    "录制前测试麦克风是否正常",
                    "说话时保持正常音量",
                    "录制完成后可以先预览视频确认有声音"
                ]
            )

        # 4. 获取用户ID和个性化上下文
        user_id = get_current_user_id(authorization)
        personalized_context = ""
        if user_id:
            personalized_context = user_profile_service.get_personalized_context(user_id)
            if personalized_context == "这是该用户的第一次练习。":
                personalized_context = "\n\n这是该用户的第一次练习，请给予更多鼓励。\n"
            else:
                personalized_context = f"\n\n【用户历史档案】\n{personalized_context}\n请根据用户的历史表现给出针对性的反馈。\n"

        # 5. 构建 PPT 内容摘要（用于 AI 分析）
        ppt_content_summary = "\n\n".join([
            f"第 {slide.slide_number} 页：{slide.text_content[:200]}"
            for slide in slides
        ])

        # 6. 计算一些客观指标用于辅助评分
        transcript_word_count = len(transcript)
        ppt_total_words = sum(len(slide.text_content) for slide in slides)
        slide_count = len(slides)

        # 估算每页平均讲解字数
        avg_words_per_slide = transcript_word_count / slide_count if slide_count > 0 else 0

        # 计算覆盖率（简单估算）
        ppt_keywords = set()
        for slide in slides:
            # 提取 PPT 中的关键词（简单的中文分词）
            words = [w for w in slide.text_content.replace('\n', ' ').split() if len(w) > 1]
            ppt_keywords.update(words)

        # 检查用户讲解中覆盖了多少 PPT 关键词
        covered_keywords = sum(1 for kw in ppt_keywords if kw in transcript)
        coverage_rate = (covered_keywords / len(ppt_keywords) * 100) if ppt_keywords else 0

        logger.info(f"分析指标: 讲解字数={transcript_word_count}, PPT字数={ppt_total_words}, "
                   f"页数={slide_count}, 平均每页={avg_words_per_slide:.1f}字, "
                   f"关键词覆盖率={coverage_rate:.1f}%")

        # 6. 使用 AI 分析用户的演讲表现
        analysis_prompt = f"""你是一位专业、严格且公正的演讲教练。用户刚刚完成了一场 PPT 演讲练习。

【重要】你必须根据用户的实际表现给出客观、差异化的评分。绝对不要给出默认分数或固定分数。
{personalized_context}

===== PPT 内容（共 {slide_count} 页）=====
{ppt_content_summary}

===== 用户讲解内容（共 {transcript_word_count} 字）=====
{transcript}

===== 客观数据分析 =====
- 讲解总字数：{transcript_word_count} 字
- PPT 总页数：{slide_count} 页
- 平均每页讲解：{avg_words_per_slide:.1f} 字
- 关键词覆盖率：{coverage_rate:.1f}%
- 参考标准：一般每页 PPT 建议讲解 100-200 字

===== 严格评分标准 =====
【90-100分 - 优秀】满足以下全部条件：
- 讲解字数充足（每页 150+ 字）
- 覆盖 PPT 所有核心要点（覆盖率 80%+）
- 逻辑清晰，有开场、过渡、总结
- 表达自然流畅，有个人见解或补充
- 几乎没有语法或表达问题

【75-89分 - 良好】满足以下大部分条件：
- 讲解字数适中（每页 80-150 字）
- 覆盖大部分要点（覆盖率 60-80%）
- 基本有逻辑结构
- 表达较清楚，偶有小问题

【60-74分 - 及格】存在以下部分问题：
- 讲解字数较少（每页 50-80 字）
- 遗漏部分重要内容（覆盖率 40-60%）
- 逻辑结构不够清晰
- 表达有时不够流畅

【40-59分 - 需努力】存在以下多个问题：
- 讲解过于简短（每页 < 50 字）
- 遗漏较多内容（覆盖率 < 40%）
- 缺乏逻辑结构
- 表达不清楚或有较多问题

【0-39分 - 不及格】存在以下严重问题：
- 几乎没有有效讲解
- 完全偏离主题
- 无法听懂或理解

===== 你的任务 =====
1. 仔细阅读用户的讲解内容
2. 对照 PPT 内容检查覆盖情况
3. 结合客观数据和主观判断给出评分
4. 给出具体、针对性的反馈

【重要提醒】
- 评分必须根据实际表现，不同表现要有明显分数差异
- 如果用户讲得很简短，分数应该较低（60-70分）
- 如果用户讲得详细且覆盖完整，分数应该较高（85-95分）
- 不要总是给 80-85 分这种"安全"分数

请返回以下 JSON 格式（score 必须是整数）：
```json
{{
  "score": <根据实际表现计算的分数，整数>,
  "strengths": ["优点1（要具体）", "优点2", "..."],
  "improvements": ["需改进1（要具体指出问题）", "需改进2", "..."],
  "overall_feedback": "2-3段详细反馈，包含：1)对整体表现的评价 2)具体的好与不好 3)鼓励的话",
  "suggestions": ["具体可操作的建议1", "建议2", "..."]
}}
```"""

        # 使用 call_llm 方法（需要传入 Message 对象列表）
        analysis_result = await llm_client.call_llm([
            Message(role="user", content=analysis_prompt)
        ])

        logger.info(f"AI 分析完成: {len(analysis_result)} 字符")

        # 6. 解析 AI 返回的 JSON
        import json
        import re

        logger.info(f"AI 原始返回: {analysis_result[:500]}...")

        # 尝试多种方式提取 JSON
        analysis_data = None

        # 方式1: 匹配 ```json ... ```
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', analysis_result, re.DOTALL)
        if json_match:
            try:
                analysis_data = json.loads(json_match.group(1))
                logger.info(f"方式1解析成功: score={analysis_data.get('score')}")
            except json.JSONDecodeError as e:
                logger.warning(f"方式1 JSON解析失败: {e}")

        # 方式2: 匹配 ``` ... ``` (不带json标记)
        if not analysis_data:
            json_match = re.search(r'```\s*(\{.*?\})\s*```', analysis_result, re.DOTALL)
            if json_match:
                try:
                    analysis_data = json.loads(json_match.group(1))
                    logger.info(f"方式2解析成功: score={analysis_data.get('score')}")
                except json.JSONDecodeError as e:
                    logger.warning(f"方式2 JSON解析失败: {e}")

        # 方式3: 直接查找 { ... }
        if not analysis_data:
            json_match = re.search(r'\{[^{}]*"score"[^{}]*\}', analysis_result, re.DOTALL)
            if json_match:
                try:
                    analysis_data = json.loads(json_match.group(0))
                    logger.info(f"方式3解析成功: score={analysis_data.get('score')}")
                except json.JSONDecodeError as e:
                    logger.warning(f"方式3 JSON解析失败: {e}")

        # 方式4: 尝试直接解析整个返回
        if not analysis_data:
            try:
                analysis_data = json.loads(analysis_result)
                logger.info(f"方式4解析成功: score={analysis_data.get('score')}")
            except json.JSONDecodeError:
                pass

        # 如果所有方式都失败，根据客观数据计算一个基础分数
        if not analysis_data:
            # 根据客观数据计算基础分数
            base_score = 50  # 基础分
            if avg_words_per_slide >= 150:
                base_score += 25
            elif avg_words_per_slide >= 80:
                base_score += 15
            elif avg_words_per_slide >= 50:
                base_score += 5

            if coverage_rate >= 80:
                base_score += 15
            elif coverage_rate >= 60:
                base_score += 10
            elif coverage_rate >= 40:
                base_score += 5

            logger.warning(f"JSON解析失败，使用计算分数: {base_score}")
            analysis_data = {
                "score": min(base_score, 95),  # 最高95分
                "strengths": ["完成了演讲练习"],
                "improvements": ["建议增加讲解内容", "覆盖更多PPT要点"],
                "overall_feedback": f"你完成了这次演讲练习。讲解内容共 {transcript_word_count} 字，平均每页 {avg_words_per_slide:.0f} 字。" + (analysis_result[:300] if analysis_result else ""),
                "suggestions": ["增加每页的讲解内容", "尝试覆盖PPT中的所有要点", "加入个人见解和例子"]
            }

        # 验证分数范围
        score = analysis_data.get("score", 70)
        if not isinstance(score, (int, float)):
            try:
                score = int(score)
            except:
                score = 70
        score = max(0, min(100, score))  # 确保在 0-100 范围内
        analysis_data["score"] = score
        logger.info(f"最终评分: {score}")

        # 7. 生成 AI 示范讲解（如何更好地讲解这个 PPT）
        demo_prompt = f"""你是一位专业的演讲教练。请为这个 PPT 生成一段完整的示范讲解话术（2-3分钟）。

**PPT 内容：**
{ppt_content_summary}

**要求：**
- 语言自然流畅，像真人在演讲
- 结构清晰（开场 → 逐页讲解 → 总结）
- 使用过渡词和引导语
- 覆盖所有核心要点
- 只返回示范讲解的话术，不要加任何说明

请直接开始示范讲解："""

        # 使用 call_llm 方法生成示范讲解
        demo_script = await llm_client.call_llm([
            Message(role="user", content=demo_prompt)
        ])

        logger.info(f"AI 示范生成完成: {len(demo_script)} 字符")

        # 8. 如果用户已登录，保存练习记录
        if user_id:
            try:
                # 创建练习记录
                record = PracticeRecord(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    practice_type=PracticeType.PPT,
                    timestamp=datetime.utcnow(),
                    transcript=transcript,
                    word_count=len(transcript),
                    overall_score=analysis_data.get("score", 75),
                    content_score=None,
                    fluency_score=None,
                    clarity_score=None,
                    strengths=analysis_data.get("strengths", []),
                    improvements=analysis_data.get("improvements", []),
                    metadata={
                        "presentation_id": presentation_id,
                        "slide_count": len(slides)
                    }
                )

                # 保存到用户档案
                user_profile_service.add_practice_record(user_id, record)
                logger.info(f"已保存用户PPT练习记录: user={user_id}")

            except Exception as e:
                logger.error(f"保存用户记录失败: {str(e)}", exc_info=True)

        # 9. 清理临时文件
        try:
            os.remove(video_path)
            os.remove(audio_path)
        except:
            pass

        # 10. 返回分析结果
        return VideoAnalysisResponse(
            presentation_id=presentation_id,
            transcript=transcript,
            overall_score=analysis_data.get("score", 75),
            overall_feedback=analysis_data.get("overall_feedback", ""),
            strengths=analysis_data.get("strengths", []),
            improvements=analysis_data.get("improvements", []),
            demo_script=demo_script,
            suggestions=analysis_data.get("suggestions", [])
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"视频分析失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"分析失败: {str(e)}"
        )
