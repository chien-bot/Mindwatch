#!/usr/bin/env python
"""
调试示范文本提取
"""
import asyncio
import sys
import os
import re

sys.path.insert(0, os.path.dirname(__file__))

from app.api.v1.self_intro_audio import get_self_intro_feedback


async def main():
    """测试提取"""
    user_text = "大家好，我叫李四，是一名大学生。"

    print("用户输入:", user_text)
    print("\n" + "=" * 80)

    ai_reply, demo_text = await get_self_intro_feedback(user_text)

    print("AI 完整响应:")
    print("=" * 80)
    print(ai_reply)
    print("=" * 80)

    print("\n提取的示范文本:")
    print("=" * 80)
    if demo_text:
        print(f"✅ 成功 ({len(demo_text)} 字符)")
        print(demo_text)
    else:
        print("❌ 提取失败")

        # 手动检查响应中是否包含引号
        print("\n调试信息:")
        print(f"  - 包含双引号: {'\"' in ai_reply}")
        print(f"  - 包含中文引号: {'"' in ai_reply or '"' in ai_reply}")

        # 显示所有引号匹配
        double_quotes = re.findall(r'"([^"]+)"', ai_reply)
        chinese_quotes = re.findall(r'"([^"]+)"', ai_reply)

        if double_quotes:
            print(f"\n  找到 {len(double_quotes)} 个双引号匹配:")
            for i, match in enumerate(double_quotes, 1):
                print(f"    {i}. [{len(match)}字符] {match[:50]}...")

        if chinese_quotes:
            print(f"\n  找到 {len(chinese_quotes)} 个中文引号匹配:")
            for i, match in enumerate(chinese_quotes, 1):
                print(f"    {i}. [{len(match)}字符] {match[:50]}...")


if __name__ == "__main__":
    asyncio.run(main())
