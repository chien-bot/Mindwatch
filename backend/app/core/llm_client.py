"""
LLM 客户端模块
封装调用大语言模型的逻辑,支持 mock 模式、OpenAI API 和开源方案（Ollama）
"""

# 禁用 huggingface_hub 的进度条以避免 tqdm 兼容性问题
import os
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"

import asyncio
import logging
from typing import List, Dict
from app.core.config import settings
from app.models.chat import Message

logger = logging.getLogger(__name__)


class LLMClient:
    """LLM 客户端类"""

    def __init__(self):
        self.use_mock = settings.USE_MOCK_LLM
        self.use_opensource = settings.USE_OPENSOURCE

    async def call_llm(self, messages: List[Message]) -> str:
        """
        调用 LLM 获取回复

        Args:
            messages: 消息列表,包含 system prompt、历史对话和当前用户输入

        Returns:
            AI 的回复文本
        """
        if self.use_mock:
            return await self._mock_llm_response(messages)
        elif self.use_opensource:
            return await self._call_ollama(messages)
        else:
            return await self._call_openai(messages)

    async def _mock_llm_response(self, messages: List[Message]) -> str:
        """
        Mock LLM 响应(用于开发测试)
        根据 system prompt 的内容(即模式)返回不同的示例回复
        """
        # 模拟网络延迟
        await asyncio.sleep(0.5)

        # 获取 system prompt 来判断当前模式
        system_prompt = ""
        user_message = ""

        for msg in messages:
            if msg.role == "system":
                system_prompt = msg.content
            elif msg.role == "user":
                user_message = msg.content

        # 根据 system prompt 关键词判断模式
        if "演讲教练" in system_prompt:
            return self._mock_ppt_response(user_message)
        elif "面试官" in system_prompt or "面试教练" in system_prompt:
            return self._mock_interview_response(user_message)
        elif "自我介绍" in system_prompt:
            return self._mock_self_intro_response(user_message)
        else:
            return "你好!我是你的 AI 口语教练,很高兴为你服务。"

    def _mock_ppt_response(self, user_message: str) -> str:
        """Mock PPT 模式的回复"""
        return f"""**理解确认:**
我理解你想表达的是:{user_message[:50]}{'...' if len(user_message) > 50 else ''}

**改进建议:**
1. **开场更有力**: 可以先抛出一个问题或数据,吸引听众注意力
2. **结构优化**: 建议明确说出"我今天要讲三个要点",让听众有预期
3. **语言精炼**: 有些表述可以更简洁,避免冗余

**示范说法:**
"大家好!你们知道吗,[核心数据/问题]。今天我想用 5 分钟时间,和大家分享我们团队在这个项目上的三个关键进展:第一...,第二...,第三..."

继续练习吧!你可以试着按这个结构再说一遍。"""

    def _mock_interview_response(self, user_message: str) -> str:
        """Mock 面试模式的回复"""
        # 简单判断:如果用户消息很短,可能是刚开始,我们先提问
        if len(user_message) < 20:
            return """很高兴见到你!让我们开始模拟面试吧。

**第一个问题:**
请用 1-2 分钟时间做一个自我介绍,重点讲讲你的背景、技能和为什么对这个职位感兴趣。

(回答后我会给你详细的反馈)"""
        else:
            # 如果用户已经回答了问题,我们给点评
            return f"""**结构分析:**
你的回答涵盖了基本信息,但结构上可以更清晰。建议使用"现在-过去-未来"的框架。

**改进建议:**
- 开头可以用一句话总结你的定位,比如"我是一名专注于 XX 的 XX"
- 过去的经历要有 1-2 个具体例子支撑
- 说明你为什么适合这个岗位(未来展望)

**示范回答:**
"我是一名有 X 年经验的[职位],专注于[领域]。在上一份工作中,我主导了[具体项目],实现了[具体成果]。我对贵公司的[XX]非常感兴趣,相信我的[技能]可以为团队带来价值..."

**追问:**
你刚才提到了[某个项目/经历],能具体说说你在其中遇到的最大挑战是什么吗?"""

    def _mock_self_intro_response(self, user_message: str) -> str:
        """Mock 自我介绍模式的回复 - 示范教学法"""
        return """**快速诊断：**
你的自我介绍包含了基本信息，但表达比较平淡，缺少具体事例和记忆点。

**直接示范 - 你可以这样说：**

"大家好，我叫小明，目前是高二的学生，对编程和人工智能特别着迷。去年我自学 Python 后，做了一个帮助同学们查询课表的小程序，现在全校有 200 多人在用。我还担任学生会技术部长，负责维护学校官网。平时我喜欢在开源社区学习，也常常和同学分享有趣的技术。未来我希望能进入计算机专业深造，用技术让生活更便捷。很高兴认识大家！"

**为什么这样说更好：**
1. **有具体成果** - "200多人在用"比"做过小程序"更有说服力
2. **突出行动力** - 展示了自学能力和实践经验
3. **有清晰目标** - 说明了未来方向，显得有规划
4. **收尾友好** - 自然地打开话题，便于继续交流

**（如果是社交场合，可以这样说）：**
"嗨大家好！我是小明，一个热爱编程的高中生。最近在捣鼓一个课表查询小工具，没想到挺受欢迎的，现在全校 200 多人都在用。平时除了写代码，我也喜欢逛技术社区，经常能发现很酷的项目。希望能和大家多交流，一起学习进步！"

---

💡 **练习建议：** 试着用这个结构再说一遍，记得加入你自己的具体事例！"""

    async def _call_ollama(self, messages: List[Message]) -> str:
        """
        调用本地 Ollama API（开源方案）
        """
        import httpx

        url = f"{settings.OLLAMA_BASE_URL}/api/chat"

        payload = {
            "model": settings.OLLAMA_MODEL,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_predict": 2500  # 增加最大 token 数，避免面试评价被截断
            }
        }

        try:
            # trust_env=False 禁用代理,确保 localhost 连接正常
            async with httpx.AsyncClient(timeout=120.0, trust_env=False) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                result = response.json()
                return result["message"]["content"]
        except httpx.ConnectError:
            logger.error("无法连接到 Ollama，请确保 Ollama 正在运行")
            raise ConnectionError("无法连接到 Ollama。请运行: ollama serve")
        except Exception as e:
            logger.error(f"Ollama 调用失败: {str(e)}")
            raise

    async def _call_openai(self, messages: List[Message]) -> str:
        """
        调用 OpenAI API（付费方案）
        """
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": m.role, "content": m.content} for m in messages],
            temperature=0.7,
            max_tokens=1500
        )

        return response.choices[0].message.content


# ============ ASR (语音转文字) ============

async def transcribe_audio(audio_content: bytes, filename: str = "audio.webm") -> str:
    """
    将语音文件转为文字

    Args:
        audio_content: 音频文件的二进制内容
        filename: 文件名（用于指定文件类型）

    Returns:
        识别出的文字
    """
    if settings.USE_MOCK_LLM:
        # Mock 模式：返回示例文本
        await asyncio.sleep(0.5)
        return """大家好，我叫小明，目前是一名高中二年级的学生。
我对计算机编程和人工智能特别感兴趣，平时喜欢自学一些编程课程。
在学校里，我担任学生会的技术部长，负责维护学校的网站和一些小程序。
我的性格比较外向，喜欢和同学们交流学习经验。
未来我希望能够进入一所好的大学，继续深造计算机科学，
并且能够用技术帮助更多的人解决实际问题。谢谢大家！"""

    elif settings.USE_OPENSOURCE:
        # 开源方案：使用 faster-whisper 本地模型
        return await _transcribe_with_faster_whisper(audio_content, filename)
    else:
        # 付费方案：调用 OpenAI Whisper API
        return await _transcribe_with_openai(audio_content, filename)


async def _transcribe_with_faster_whisper(audio_content: bytes, filename: str) -> str:
    """
    使用 faster-whisper 本地模型进行语音识别
    """
    import tempfile
    import os

    # 将音频内容保存到临时文件
    suffix = "." + filename.split(".")[-1] if "." in filename else ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
        tmp_file.write(audio_content)
        tmp_path = tmp_file.name

    # 如果是 WebM 格式，先转换为 WAV（faster-whisper 更好支持）
    wav_path = None
    if suffix.lower() in ['.webm', '.ogg', '.opus']:
        wav_path = tmp_path.replace(suffix, '.wav')
        try:
            import subprocess
            result = subprocess.run([
                'ffmpeg', '-y',
                '-i', tmp_path,
                '-acodec', 'pcm_s16le',
                '-ar', '16000',
                '-ac', '1',
                wav_path
            ], capture_output=True, text=True)

            if result.returncode == 0:
                logger.info(f"音频转换成功: {suffix} -> .wav")
                audio_path_to_use = wav_path
            else:
                logger.warning(f"ffmpeg 转换失败: {result.stderr}, 尝试直接使用原始文件")
                audio_path_to_use = tmp_path
        except Exception as e:
            logger.warning(f"ffmpeg 转换异常: {e}, 尝试直接使用原始文件")
            audio_path_to_use = tmp_path
    else:
        audio_path_to_use = tmp_path

    try:
        # 在线程池中运行同步代码（faster-whisper 是同步的）
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _run_faster_whisper, audio_path_to_use)
        return result
    finally:
        # 清理临时文件
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        if wav_path and os.path.exists(wav_path):
            os.remove(wav_path)


def _run_faster_whisper(audio_path: str) -> str:
    """
    同步运行 faster-whisper（在线程池中执行）
    """
    try:
        from faster_whisper import WhisperModel

        # 使用轻量级模型，适合 8GB 内存
        # local_files_only=True 避免重新下载，模型已经预先下载好了
        model = WhisperModel(
            settings.WHISPER_MODEL,  # tiny / base / small
            device="cpu",
            compute_type="int8",  # 使用 int8 量化减少内存
            local_files_only=True  # 只使用本地已下载的模型
        )

        segments, info = model.transcribe(
            audio_path,
            language="zh",
            beam_size=5
        )

        # 合并所有片段
        text = " ".join([segment.text for segment in segments])
        return text.strip()

    except ImportError:
        logger.error("faster-whisper 未安装，请运行: pip install faster-whisper")
        raise ImportError("请安装 faster-whisper: pip install faster-whisper")
    except Exception as e:
        logger.error(f"faster-whisper 转写失败: {str(e)}")
        raise


async def _transcribe_with_openai(audio_content: bytes, filename: str) -> str:
    """
    使用 OpenAI Whisper API 进行语音识别（付费）
    """
    from openai import AsyncOpenAI
    import io

    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL
    )

    # 将 bytes 转换为文件对象
    audio_file = io.BytesIO(audio_content)
    audio_file.name = filename

    transcript = await client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language="zh"
    )

    return transcript.text


# ============ TTS (文字转语音) ============

async def synthesize_speech(text: str) -> bytes:
    """
    将文字转为语音

    Args:
        text: 要转换的文字

    Returns:
        音频文件的二进制内容（MP3 格式）
    """
    if settings.USE_MOCK_LLM:
        # Mock 模式：返回空的音频数据
        return b""

    elif settings.USE_OPENSOURCE:
        # 开源方案：使用 edge-tts（微软免费 TTS）
        return await _synthesize_with_edge_tts(text)
    else:
        # 付费方案：调用 OpenAI TTS API
        return await _synthesize_with_openai(text)


async def _synthesize_with_edge_tts(text: str) -> bytes:
    """
    使用 edge-tts（微软免费 TTS）生成语音
    """
    try:
        import edge_tts
        import tempfile
        import os

        # 创建临时文件
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
            tmp_path = tmp_file.name

        try:
            # 生成语音
            communicate = edge_tts.Communicate(
                text,
                voice=settings.EDGE_TTS_VOICE  # zh-CN-XiaoxiaoNeural
            )
            await communicate.save(tmp_path)

            # 读取音频内容
            with open(tmp_path, "rb") as f:
                audio_content = f.read()

            return audio_content
        finally:
            # 清理临时文件
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    except ImportError:
        logger.error("edge-tts 未安装，请运行: pip install edge-tts")
        raise ImportError("请安装 edge-tts: pip install edge-tts")
    except Exception as e:
        logger.error(f"edge-tts 生成失败: {str(e)}")
        raise


async def _synthesize_with_openai(text: str) -> bytes:
    """
    使用 OpenAI TTS API 生成语音（付费）
    """
    from openai import AsyncOpenAI

    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL
    )

    response = await client.audio.speech.create(
        model="tts-1",
        voice="nova",
        input=text,
        response_format="mp3"
    )

    return response.content


# ============ Vision (图片识别) ============

async def analyze_slide_with_vision(
    slide_image_url: str,
    user_transcript: str,
    slide_number: int,
    slide_text: str = ""
) -> str:
    """
    分析 PPT 幻灯片和用户讲解

    注意：8GB 内存无法运行本地 Vision 模型，
    开源模式下将使用文字分析替代图片识别

    Args:
        slide_image_url: 幻灯片图片的 URL
        user_transcript: 用户讲解的转写文本
        slide_number: 幻灯片编号
        slide_text: 从 PPT 提取的文字内容

    Returns:
        AI 的分析和示范教学反馈
    """
    if settings.USE_MOCK_LLM:
        # Mock 模式
        await asyncio.sleep(1.0)
        return _get_mock_vision_response(slide_number, slide_text, user_transcript)

    elif settings.USE_OPENSOURCE:
        # 开源方案：使用 Ollama 进行文字分析（8GB 内存无法运行 Vision 模型）
        return await _analyze_slide_with_ollama(slide_number, slide_text, user_transcript)
    else:
        # 付费方案：使用 GPT-4 Vision
        return await _analyze_slide_with_gpt4_vision(
            slide_image_url, user_transcript, slide_number, slide_text
        )


def _get_mock_vision_response(slide_number: int, slide_text: str, user_transcript: str) -> str:
    """Mock Vision 响应"""
    return f"""**幻灯片内容分析（第 {slide_number} 页）：**
我看到这页 PPT 包含以下内容：{slide_text[:100] if slide_text else "图表和文字"}...

**你的讲解分析：**
你提到了：{user_transcript[:100]}...
总体来说，你的讲解基本覆盖了幻灯片的核心内容，但可以更加流畅和有条理。

**直接示范 - 这一页你可以这样讲：**

"大家请看这一页。{slide_text.split(chr(10))[0] if slide_text else '这里展示的是我们的核心数据'}。从图表中可以看出，我们在过去一年取得了显著的进展。具体来说，第一，[关键点1]；第二，[关键点2]；第三，[关键点3]。这些成果得益于团队的共同努力和技术创新。"

**为什么这样讲更好：**
1. **开场明确** - 引导听众注意力到幻灯片
2. **结构清晰** - 用"第一、第二、第三"让听众容易跟上
3. **有总结** - 最后点明意义，而不是简单念完就结束

**关于这页 PPT 的优化建议：**
✅ **保留的内容：** 核心数据和图表展示很清晰
⚠️ **可以改进：**
  - 文字可以精简，只保留关键词
  - 如果有图表，可以突出显示最重要的趋势
  - 标题可以更吸引人，比如用问句或数据
❌ **建议删减：** 如果有过多的解释性文字，可以删掉，改为口头讲解

---
💡 **练习建议：** 试着用这个结构再讲一遍这一页，记得放慢语速，给听众时间理解！"""


async def _analyze_slide_with_ollama(
    slide_number: int,
    slide_text: str,
    user_transcript: str
) -> str:
    """
    使用 Ollama 进行文字分析（开源方案）
    注意：8GB 内存无法运行 Vision 模型，所以只分析提取的文字
    """
    import httpx

    system_prompt = """你是一位专业的 PPT 演讲教练，采用"示范教学法"指导用户。

你的任务：
1. 分析幻灯片的文字内容
2. 对比用户讲解是否覆盖了核心内容
3. 直接示范如何讲解这一页
4. 提供 PPT 优化建议

**核心原则：不要只给建议，要直接示范怎么讲！**"""

    user_message = f"""**幻灯片编号：** 第 {slide_number} 页

**幻灯片文字内容：**
{slide_text if slide_text else "（无文字内容）"}

**用户的讲解：**
{user_transcript}

---

请完成以下任务：

1. **分析幻灯片内容**：从文字中识别关键信息
2. **对比分析**：
   - 用户讲解是否覆盖了核心内容？
   - 讲解是否清晰、有条理？
3. **直接示范**：给出这一页的完整示范讲解（30-60秒）
4. **PPT 优化建议**：
   - ✅ 哪些内容应该保留
   - ⚠️ 哪些内容可以改进
   - ❌ 哪些内容应该删减

请用鼓励、实用的语气回复。"""

    url = f"{settings.OLLAMA_BASE_URL}/api/chat"
    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_predict": 2000
        }
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            result = response.json()
            return result["message"]["content"]
    except httpx.ConnectError:
        logger.error("无法连接到 Ollama")
        raise ConnectionError("无法连接到 Ollama。请运行: ollama serve")
    except Exception as e:
        logger.error(f"Ollama 调用失败: {str(e)}")
        raise


async def generate_slide_demo_script(
    slide_number: int,
    slide_text: str,
    slide_image_path: str = None
) -> str:
    """
    为指定幻灯片生成 AI 示范讲解话术

    注意：不需要用户的录音，直接根据 PPT 内容生成示范讲解

    Args:
        slide_number: 幻灯片编号
        slide_text: 从 PPT 提取的文字内容
        slide_image_path: 幻灯片图片路径（可选，开源方案不使用）

    Returns:
        AI 示范讲解话术（30-60秒的演讲稿）
    """
    if settings.USE_MOCK_LLM:
        # Mock 模式
        await asyncio.sleep(0.5)
        return f"大家好，请看第 {slide_number} 页。{slide_text[:50] if slide_text else '这页展示了我们的核心内容'}。让我为大家详细讲解一下..."

    elif settings.USE_OPENSOURCE:
        # 开源方案：使用 Ollama 生成示范话术
        return await _generate_demo_script_with_ollama(slide_number, slide_text)
    else:
        # 付费方案：使用 GPT-4 Vision 生成示范话术
        return await _generate_demo_script_with_gpt4_vision(slide_number, slide_text, slide_image_path)


async def _generate_demo_script_with_ollama(
    slide_number: int,
    slide_text: str
) -> str:
    """
    使用 Ollama 生成示范讲解话术（开源方案）
    """
    import httpx

    system_prompt = """你是一位专业的演讲教练，帮助用户学习如何讲解 PPT。

你的任务：
- 根据幻灯片的文字内容，生成一段30-60秒的示范讲解话术
- 讲解要清晰、有条理、引人入胜
- 使用\"大家请看\"、\"第一\"、\"第二\"等过渡词
- 语言要口语化，像真人在演讲

**要求：只输出示范讲解的话术，不要加任何解释或标题。**"""

    user_message = f"""**幻灯片编号：** 第 {slide_number} 页

**幻灯片文字内容：**
{slide_text if slide_text else "（图表或图片，无文字）"}

---

请生成一段30-60秒的示范讲解话术，演示如何讲解这一页 PPT。
只输出讲解话术本身，不要加标题或解释。"""

    url = f"{settings.OLLAMA_BASE_URL}/api/chat"
    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "stream": False,
        "options": {
            "temperature": 0.7,
            "num_predict": 500
        }
    }

    try:
        async with httpx.AsyncClient(timeout=60.0, trust_env=False) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            result = response.json()
            demo_script = result["message"]["content"].strip()

            # 移除可能的标题或格式
            demo_script = demo_script.replace("**示范讲解：**", "")
            demo_script = demo_script.replace("**话术：**", "")
            demo_script = demo_script.strip()

            return demo_script
    except Exception as e:
        logger.error(f"生成示范话术失败: {str(e)}")
        # 返回简单的示范
        return f"大家好，请看第 {slide_number} 页。{slide_text[:100] if slide_text else '这页展示了我们的核心内容'}。"


async def _generate_demo_script_with_gpt4_vision(
    slide_number: int,
    slide_text: str,
    slide_image_path: str = None
) -> str:
    """
    使用 GPT-4 Vision 生成示范讲解话术（付费方案）
    """
    from openai import AsyncOpenAI
    import base64

    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL
    )

    # 如果有图片，读取并编码
    image_data = None
    if slide_image_path and os.path.exists(slide_image_path):
        with open(slide_image_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')

    # 构建消息
    if image_data:
        content = [
            {"type": "text", "text": f"这是第 {slide_number} 页 PPT。请生成一段30-60秒的示范讲解话术，演示如何讲解这一页。只输出话术本身，不要加标题。"},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_data}"}}
        ]
    else:
        content = f"这是第 {slide_number} 页 PPT，内容如下：\n\n{slide_text}\n\n请生成一段30-60秒的示范讲解话术。只输出话术本身。"

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "你是演讲教练，生成示范讲解话术。"},
            {"role": "user", "content": content}
        ],
        max_tokens=500,
        temperature=0.7
    )

    return response.choices[0].message.content.strip()


async def _analyze_slide_with_gpt4_vision(
    slide_image_url: str,
    user_transcript: str,
    slide_number: int,
    slide_text: str
) -> str:
    """
    使用 GPT-4 Vision 分析幻灯片（付费方案）
    """
    from openai import AsyncOpenAI
    import base64
    from pathlib import Path

    client = AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL
    )

    # 构建图片内容
    image_content = None
    if slide_image_url.startswith('http'):
        image_content = {
            "type": "image_url",
            "image_url": {"url": slide_image_url}
        }
    else:
        image_path = Path(slide_image_url)
        if image_path.exists():
            with open(image_path, "rb") as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
            image_content = {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{image_data}"
                }
            }

    if not image_content:
        raise ValueError(f"无法读取幻灯片图片: {slide_image_url}")

    system_prompt = """你是一位专业的 PPT 演讲教练，采用"示范教学法"指导用户。

你的任务：
1. **分析幻灯片内容** - 从图片中识别文字、图表、图像
2. **对比用户讲解** - 判断用户的讲解是否覆盖了幻灯片的核心内容
3. **直接示范** - 给出这一页的完整示范讲解话术
4. **PPT 优化建议** - 建议这页 PPT 应该保留、修改或删减什么内容

**核心原则：不要只给建议，要直接示范怎么讲！**"""

    user_message = f"""**幻灯片编号：** 第 {slide_number} 页

**提取的文字内容：**
{slide_text if slide_text else "（无文字提取）"}

**用户的讲解：**
{user_transcript}

---

请完成以下任务：

1. **分析幻灯片内容**：从图片中识别关键信息（标题、要点、图表等）
2. **对比分析**：用户讲解是否覆盖了核心内容？是否流畅？
3. **直接示范**：给出这一页的完整示范讲解（30-60秒）
4. **PPT 优化建议**：✅保留 ⚠️改进 ❌删减

请用鼓励、实用的语气回复。"""

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_message},
                    image_content
                ]
            }
        ],
        max_tokens=2000,
        temperature=0.7
    )

    return response.choices[0].message.content


# 创建全局 LLM 客户端实例
llm_client = LLMClient()
