/**
 * Next.js App 配置
 * 全局布局：导航栏 + 页面内容
 * 练习页面不显示导航栏，保持沉浸式体验
 */

import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Navbar from '@/components/layout/Navbar';

// 不需要显示导航栏的页面路径（练习页面需要沉浸式体验）
const PAGES_WITHOUT_NAVBAR = ['/practice/self-intro', '/practice/interview', '/practice/ppt'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // 判断当前页面是否需要显示导航栏
  const showNavbar = !PAGES_WITHOUT_NAVBAR.some(path =>
    router.pathname.startsWith(path)
  );

  return (
    <>
      {/* 条件渲染导航栏 */}
      {showNavbar && <Navbar />}

      {/* 页面内容：有导航栏时添加顶部间距 */}
      <div className={showNavbar ? 'pt-16' : ''}>
        <Component {...pageProps} />
      </div>
    </>
  );
}
