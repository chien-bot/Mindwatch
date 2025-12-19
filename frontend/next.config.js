/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 配置后端 API 地址
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  },
}

module.exports = nextConfig
