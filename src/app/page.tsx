'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, DollarSign, Calendar, TrendingUp, Plus, List, Factory, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Stats {
  todayOrders: number;
  todaySales: number;
  monthOrders: number;
  monthSales: number;
  dailyOrders: Array<{ date: string; count: number; total: number }>;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0,
    todaySales: 0,
    monthOrders: 0,
    monthSales: 0,
    dailyOrders: [],
  });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('获取统计数据失败:', err));
  }, []);

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    return `${parseInt(parts[2])}日`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部标题 */}
      <div className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-center">汽车脚垫工厂管理</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 数字卡片 */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">今日订单</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.todayOrders}</p>
                </div>
                <Package className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">今日销售额</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.todaySales)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">本月订单</p>
                  <p className="text-2xl font-bold text-green-600">{stats.monthOrders}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">本月销售额</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(stats.monthSales)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 订单趋势图 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">当月订单趋势</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyOrders}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'total') return formatCurrency(value);
                      return value;
                    }}
                    labelFormatter={(label) => label}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    name="订单数"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    name="销售额"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 快捷入口 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-2">
            <Link href="/order/new">
              <Button variant="outline" className="w-full h-12 flex flex-col items-center gap-1">
                <Plus className="w-5 h-5 text-blue-600" />
                <span className="text-xs">下单</span>
              </Button>
            </Link>
            <Link href="/order/list">
              <Button variant="outline" className="w-full h-12 flex flex-col items-center gap-1">
                <List className="w-5 h-5 text-blue-600" />
                <span className="text-xs">订单</span>
              </Button>
            </Link>
            <Link href="/production">
              <Button variant="outline" className="w-full h-12 flex flex-col items-center gap-1">
                <Factory className="w-5 h-5 text-blue-600" />
                <span className="text-xs">生产</span>
              </Button>
            </Link>
            <Link href="/customer">
              <Button variant="outline" className="w-full h-12 flex flex-col items-center gap-1">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-xs">客户</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-5 h-12">
          <Link href="/" className="flex flex-col items-center justify-center text-blue-600">
            <Package className="w-5 h-5" />
            <span className="text-xs mt-1">首页</span>
          </Link>
          <Link href="/order/new" className="flex flex-col items-center justify-center text-gray-600">
            <Plus className="w-5 h-5" />
            <span className="text-xs mt-1">下单</span>
          </Link>
          <Link href="/order/list" className="flex flex-col items-center justify-center text-gray-600">
            <List className="w-5 h-5" />
            <span className="text-xs mt-1">订单</span>
          </Link>
          <Link href="/production" className="flex flex-col items-center justify-center text-gray-600">
            <Factory className="w-5 h-5" />
            <span className="text-xs mt-1">生产</span>
          </Link>
          <Link href="/more" className="flex flex-col items-center justify-center text-gray-600">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs mt-1">更多</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}