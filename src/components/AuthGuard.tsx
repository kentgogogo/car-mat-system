'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 检查登录状态
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const loginTime = localStorage.getItem('loginTime');
    
    // 登录有效期检查（24小时）
    if (isLoggedIn === 'true' && loginTime) {
      const loginDate = new Date(loginTime);
      const now = new Date();
      const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        setIsAuthenticated(true);
      } else {
        // 登录过期，清除状态
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('loginTime');
      }
    }
    
    setChecking(false);
  }, []);

  useEffect(() => {
    if (!checking && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [checking, isAuthenticated, pathname, router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}