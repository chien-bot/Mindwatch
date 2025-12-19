#!/usr/bin/env python
"""
测试自我介绍示范功能
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.api.v1.self_intro_audio import get_self_intro_feedback, extract_demo_text


async def test_demo_extraction():
    """测试从 AI 响应中提取示范文本"""
    print("=" * 60)
    print("测试示范文本提取功能")
    print("=" * 60)

    # 模拟用户输入
    user_text = "大家好，我叫张三，我是一名程序员。"

    print(f"\n用户输入: {user_text}")
    print("\n⏳ 调用 LLM...")

    try:
        # 获取 AI 反馈和示范文本
        ai_reply, demo_text = await get_self_intro_feedback(user_text)

        print("\n✅ LLM 调用成功!")
        print("\n" + "=" * 60)
        print("AI 完整响应:")
        print("=" * 60)
        print(ai_reply)

        print("\n" + "=" * 60)
        print("提取的示范文本:")
        print("=" * 60)
        if demo_text:
            print(f"✅ 成功提取 ({len(demo_text)} 字符)")
            print(demo_text)
        else:
            print("⚠️  未能提取示范文本")

        return bool(demo_text)

    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_manual_extraction():
    """测试提取逻辑"""
    print("\n" + "=" * 60)
    print("测试手动提取逻辑")
    print("=" * 60)

    # 模拟不同格式的 AI 响应
    test_cases = [
        {
            "name": "双引号格式",
            "text": '''**你可以这样说：**

"大家好，我是张三，一名有五年经验的全栈工程师。我专注于 Python 和 React 开发，曾主导过多个大型项目。"

这样说更好因为...''',
            "expected": True
        },
        {
            "name": "中文引号格式",
            "text": '''**直接示范：**

"大家好，我叫张三，目前在某互联网公司担任技术主管。"

**改进点：**...''',
            "expected": True
        },
        {
            "name": "无引号格式",
            "text": '''你可以这样说：

大家好，我是张三，一名资深工程师。

这样表达更有力。''',
            "expected": False
        }
    ]

    results = []
    for case in test_cases:
        print(f"\n测试: {case['name']}")
        extracted = extract_demo_text(case['text'])

        if extracted:
            print(f"  ✅ 提取成功: {extracted[:50]}...")
            success = case['expected']
        else:
            print(f"  ❌ 提取失败")
            success = not case['expected']

        results.append(success)

    return all(results)


async def main():
    """运行所有测试"""
    print("\n🔍 开始测试自我介绍示范功能\n")

    # 测试1: 完整流程（需要 Ollama 运行）
    test1_passed = await test_demo_extraction()

    # 测试2: 提取逻辑
    test2_passed = await test_manual_extraction()

    print("\n" + "=" * 60)
    print("测试结果汇总:")
    print("=" * 60)
    print(f"  完整流程测试: {'✅ 通过' if test1_passed else '❌ 失败'}")
    print(f"  提取逻辑测试: {'✅ 通过' if test2_passed else '❌ 失败'}")

    all_passed = test1_passed and test2_passed
    if all_passed:
        print("\n🎉 所有测试通过!")
    else:
        print("\n⚠️  部分测试失败")

    return all_passed


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
