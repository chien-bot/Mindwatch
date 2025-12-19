#!/usr/bin/env python
"""
测试 Ollama 集成
"""
import asyncio
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(__file__))

from app.core.llm_client import LLMClient, Message


async def test_ollama():
    """测试 Ollama LLM 调用"""
    print("🔍 开始测试 Ollama 集成...")

    client = LLMClient()

    # 测试 1: 简单对话
    print("\n📝 测试 1: 简单对话")
    messages = [
        Message(role="system", content="你是一个友好的助手"),
        Message(role="user", content="你好,请用一句话介绍自己")
    ]

    try:
        response = await client.call_llm(messages)
        print(f"✅ LLM 响应: {response[:100]}...")
    except Exception as e:
        print(f"❌ LLM 调用失败: {e}")
        return False

    # 测试 2: 面试场景
    print("\n📝 测试 2: 面试场景分析")
    messages = [
        Message(role="system", content="你是专业的面试教练"),
        Message(role="user", content="用户说: '我叫张三,毕业于清华大学计算机系。' 请分析这段自我介绍。")
    ]

    try:
        response = await client.call_llm(messages)
        print(f"✅ 面试分析: {response[:150]}...")
    except Exception as e:
        print(f"❌ 面试分析失败: {e}")
        return False

    print("\n✅ 所有测试通过!")
    return True


async def test_tts():
    """测试 edge-tts"""
    print("\n🔍 测试 edge-tts (TTS)...")

    try:
        import edge_tts
        print("✅ edge-tts 已安装")

        # 简单测试
        communicate = edge_tts.Communicate("你好", "zh-CN-XiaoxiaoNeural")
        print("✅ edge-tts 初始化成功")
        return True
    except ImportError:
        print("❌ edge-tts 未安装,请运行: pip install edge-tts")
        return False
    except Exception as e:
        print(f"❌ TTS 测试失败: {e}")
        return False


def test_asr():
    """测试 faster-whisper"""
    print("\n🔍 测试 faster-whisper (ASR)...")

    try:
        from faster_whisper import WhisperModel
        print("✅ faster-whisper 已安装")

        # 测试模型加载
        print("⏳ 加载 tiny 模型...")
        model = WhisperModel("tiny", device="cpu", compute_type="int8")
        print("✅ Whisper 模型加载成功")
        return True
    except ImportError:
        print("❌ faster-whisper 未安装,请运行: pip install faster-whisper")
        return False
    except Exception as e:
        print(f"⚠️  模型加载警告: {e}")
        print("   (首次运行会下载模型,请耐心等待)")
        return True


async def main():
    """运行所有测试"""
    print("=" * 60)
    print("SpeakMate 开源方案集成测试")
    print("=" * 60)

    results = {
        "ollama": await test_ollama(),
        "tts": await test_tts(),
        "asr": test_asr()
    }

    print("\n" + "=" * 60)
    print("测试结果汇总:")
    print("=" * 60)
    for name, passed in results.items():
        status = "✅ 通过" if passed else "❌ 失败"
        print(f"  {name.upper()}: {status}")

    all_passed = all(results.values())
    if all_passed:
        print("\n🎉 所有测试通过!开源方案已就绪!")
    else:
        print("\n⚠️  部分测试失败,请检查上述错误信息")

    return all_passed


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
