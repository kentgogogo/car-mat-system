'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Factory } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password) {
      toast.error('请输入密码');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        // 存储登录状态到 localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginTime', new Date().toISOString());
        toast.success('登录成功');
        router.push('/');
      } else {
        toast.error(data.message || '密码错误');
      }
    } catch (error) {
      toast.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <Factory className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle className="text-xl">汽车脚垫工厂管理系统</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-500 mb-4">
            请输入登录密码
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? '验证中...' : '登录'}
          </Button>
          <div className="text-center text-xs text-gray-400">
            默认密码：hc123456
          </div>
        </CardContent>
      </Card>
    </div>
  );
}