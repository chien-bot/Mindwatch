/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 配置后端 API 地址
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  },

  // GitHub Pages 配置
  output: 'export',
  images: {
    unoptimized: true, // GitHub Pages 不支持 Next.js Image Optimization
  },

  // 如果部署在子路径（如 username.github.io/repo-name），需要设置 basePath
  // basePath: '/Mindwatch',
  // assetPrefix: '/Mindwatch',
}

module.exports = nextConfig
