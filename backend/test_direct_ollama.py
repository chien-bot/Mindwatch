#!/usr/bin/env python
"""
直接测试 Ollama HTTP 调用
"""
import asyncio
import httpx


async def test_direct():
    """直接使用 httpx 调用 Ollama"""
    url = "http://localhost:11434/api/chat"

    payload = {
        "model": "qwen2.5:3b",
        "messages": [{"role": "user", "content": "你好"}],
        "stream": False
    }

    print(f"🔍 测试 URL: {url}")
    print(f"📦 Payload: {payload}")

    try:
        # 禁用代理,直接连接 localhost
        async with httpx.AsyncClient(timeout=120.0, trust_env=False) as client:
            print("⏳ 发送请求...")
            response = await client.post(url, json=payload)
            print(f"✅ 状态码: {response.status_code}")
            print(f"📝 响应: {response.text[:200]}")

            result = response.json()
            print(f"\n💬 AI 回复: {result['message']['content']}")
            return True
    except Exception as e:
        print(f"❌ 错误: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_direct())
    exit(0 if success else 1)
