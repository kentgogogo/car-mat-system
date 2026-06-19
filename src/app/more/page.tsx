'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Users, Package, Calendar, TrendingUp, Save } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface WorkerStat {
  id: number;
  name: string;
  price_per_piece: number;
  piece_count: number;
  total_salary: number;
}

interface TotalStats {
  total_pieces: number;
}

export default function MorePage() {
  const router = useRouter();
  const [stats, setStats] = useState<WorkerStat[]>([]);
  const [total, setTotal] = useState<TotalStats>({ total_pieces: 0 });
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(true);
  const [editingPrices, setEditingPrices] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchStats();
  }, [currentMonth]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/worker-stats?month=${currentMonth}`);
      const data = await res.json();
      setStats(data.stats || []);
      setTotal(data.total || { total_pieces: 0 });
      
      // 初始化编辑价格
      const prices: Record<number, number> = {};
      (data.stats || []).forEach((stat: WorkerStat) => {
        prices[stat.id] = stat.price_per_piece;
      });
      setEditingPrices(prices);
    } catch (error) {
      console.error('获取工人统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = async (workerId: number) => {
    try {
      const res = await fetch('/api/worker-stats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: workerId,
          price_per_piece: editingPrices[workerId],
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('单价更新成功');
        fetchStats();
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部标题 */}
      <div className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-center">更多功能</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 功能入口 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">功能入口</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center"
              onClick={() => router.push('/customer')}
            >
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-sm mt-2">客户管理</span>
            </Button>
          </CardContent>
        </Card>

        {/* 月份选择 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              选择月份
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="month"
              value={currentMonth}
              onChange={e => setCurrentMonth(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* 工人计件统计 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              工人计件统计 ({currentMonth})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-4 text-gray-500">加载中...</div>
            ) : stats.length === 0 ? (
              <div className="text-center py-4 text-gray-500">暂无统计数据</div>
            ) : (
              <>
                {/* 统计汇总 */}
                <div className="p-3 bg-blue-50 rounded-md mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">本月总件数</span>
                    <span className="font-bold text-blue-600">{total.total_pieces} 件</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">总工资</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(stats.reduce((sum, s) => sum + s.total_salary, 0))}
                    </span>
                  </div>
                </div>

                {/* 工人列表 */}
                {stats.map(stat => (
                  <div key={stat.id} className="p-3 bg-gray-50 rounded-md space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{stat.name}</div>
                        <div className="text-xs text-gray-500">
                          完成: {stat.piece_count} 件
                        </div>
                      </div>
                      <div className="font-bold text-blue-600">
                        {formatCurrency(stat.total_salary)}
                      </div>
                    </div>
                    
                    {/* 单价设置 */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-500 whitespace-nowrap">单价:</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={editingPrices[stat.id] || stat.price_per_piece}
                        onChange={e => setEditingPrices(prev => ({
                          ...prev,
                          [stat.id]: parseFloat(e.target.value) || 0
                        }))}
                        className="h-8 w-24"
                      />
                      <span className="text-xs text-gray-500">元/件</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => updatePrice(stat.id)}
                      >
                        <Save className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-5 h-12">
          <Link href="/" className="flex flex-col items-center justify-center text-gray-600">
            <Package className="w-5 h-5" />
            <span className="text-xs mt-1">首页</span>
          </Link>
          <Link href="/order/new" className="flex flex-col items-center justify-center text-gray-600">
            <Package className="w-5 h-5" />
            <span className="text-xs mt-1">下单</span>
          </Link>
          <Link href="/order/list" className="flex flex-col items-center justify-center text-gray-600">
            <Package className="w-5 h-5" />
            <span className="text-xs mt-1">订单</span>
          </Link>
          <Link href="/production" className="flex flex-col items-center justify-center text-gray-600">
            <Package className="w-5 h-5" />
            <span className="text-xs mt-1">生产</span>
          </Link>
          <Link href="/more" className="flex flex-col items-center justify-center text-blue-600">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs mt-1">更多</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}