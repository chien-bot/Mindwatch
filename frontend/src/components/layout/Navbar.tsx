/**
 * 导航栏组件
 * 固定在页面顶部，包含品牌名和导航链接
 * 响应式设计，移动端使用汉堡菜单
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// 导航项配置
interface NavItem {
  label: string;
  href: string;
  requireAuth?: boolean; // 是否需要登录
  requireGuest?: boolean; // 是否仅游客可见
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Product', href: '/product', requireAuth: true },
  { label: 'Login', href: '/login', requireGuest: true },
];

export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 检查登录状态
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
          setIsLoggedIn(true);
        } catch (error) {
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    checkAuth();

    // 监听路由变化，重新检查登录状态
    router.events?.on('routeChangeComplete', checkAuth);

    return () => {
      router.events?.off('routeChangeComplete', checkAuth);
    };
  }, [router]);

  // 判断当前路由是否激活
  const isActive = (href: string) => {
    if (href === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(href);
  };

  // 切换移动端菜单
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // 关闭移动端菜单
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    closeMenu();
    router.push('/');
  };

  // 过滤导航项
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.requireAuth && !isLoggedIn) return false;
    if (item.requireGuest && isLoggedIn) return false;
    return true;
  });

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 品牌名 */}
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            SpeakMate
          </Link>

          {/* 桌面端导航链接 */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}

            {/* 登录后显示用户信息和退出按钮 */}
            {isLoggedIn && (
              <>
                <div className="flex items-center gap-2 px-3 py-1 ml-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-gray-700">{user?.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  退出登录
                </button>
              </>
            )}
          </div>

          {/* 移动端汉堡菜单按钮 */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              // 关闭图标
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              // 汉堡图标
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 移动端菜单 */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`
                  block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200
                  ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}

            {/* 移动端登录后显示用户信息和退出按钮 */}
            {isLoggedIn && (
              <div className="pt-3 mt-3 border-t border-gray-200">
                <div className="flex items-center gap-3 px-4 py-2 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-all duration-200 text-left"
                >
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
