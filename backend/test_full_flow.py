#!/usr/bin/env python
"""
测试完整音频上传流程（模拟）
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.llm_client import synthesize_speech
from app.api.v1.self_intro_audio import get_self_intro_feedback


async def test_full_flow():
    """模拟完整流程"""
    print("=" * 80)
    print("模拟完整用户流程")
    print("=" * 80)

    # 步骤 1: 用户录音（模拟转写结果）
    user_transcript = "大家好，我叫王五，我是一名产品经理。"
    print(f"\n1️⃣ 用户说: {user_transcript}")

    # 步骤 2: 调用 LLM 获取反馈和示范
    print("\n2️⃣ AI 分析中...")
    ai_reply, demo_text = await get_self_intro_feedback(user_transcript)

    print(f"\n✅ AI 分析完成")
    print(f"   反馈长度: {len(ai_reply)} 字符")
    print(f"   示范长度: {len(demo_text)} 字符")

    # 步骤 3: 检查示范文本
    if demo_text:
        print(f"\n3️⃣ 示范文本提取成功:")
        print(f"   {demo_text[:100]}...")

        # 步骤 4: 生成 TTS 音频
        print("\n4️⃣ 生成示范语音...")
        try:
            audio_content = await synthesize_speech(demo_text)
            print(f"   ✅ 语音生成成功 ({len(audio_content)} 字节)")

            # 保存音频文件用于测试
            test_audio_path = "/tmp/demo_audio.mp3"
            with open(test_audio_path, "wb") as f:
                f.write(audio_content)
            print(f"   ✅ 音频已保存到: {test_audio_path}")
            print(f"   💡 可以用播放器打开测试")

        except Exception as e:
            print(f"   ❌ TTS 失败: {e}")
            return False

        print("\n" + "=" * 80)
        print("🎉 完整流程测试成功!")
        print("=" * 80)
        print("\n返回给前端的数据:")
        print({
            "transcript": user_transcript,
            "reply": ai_reply[:100] + "...",
            "demo_text": demo_text[:100] + "...",
            "mode": "self_intro"
        })

        return True
    else:
        print("\n❌ 示范文本提取失败")
        print("\nAI 完整响应:")
        print(ai_reply)
        return False


if __name__ == "__main__":
    success = asyncio.run(test_full_flow())
    sys.exit(0 if success else 1)
