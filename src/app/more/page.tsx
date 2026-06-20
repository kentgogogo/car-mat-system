'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Users, Package, Calendar, TrendingUp, Save, ClipboardList, Home, Plus, List, Factory, MoreHorizontal, Lock, LogOut, Trash2, UserPlus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface WorkerStat {
  id: number;
  name: string;
  price_per_piece: number;
  sewing_full: number;
  sewing_half: number;
  sewing_quarter: number;
  embroidery_full: number;
  embroidery_half: number;
  embroidery_tail: number;
  piece_count: number;
  total_salary: number;
}

interface TypeStat {
  name: string;
  worker_type: string;
  piece_count: number;
  total_fee: number;
}

interface TotalStats {
  total_pieces: number;
  total_salary: number;
}

export default function MorePage() {
  const router = useRouter();
  const [stats, setStats] = useState<WorkerStat[]>([]);
  const [typeStats, setTypeStats] = useState<TypeStat[]>([]);
  const [total, setTotal] = useState<TotalStats>({ total_pieces: 0, total_salary: 0 });
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(true);
  const [editingPrices, setEditingPrices] = useState<Record<number, number>>({});
  const [editingSewingPrices, setEditingSewingPrices] = useState<Record<number, { full: number; half: number; quarter: number }>>({});
  const [editingEmbroideryPrices, setEditingEmbroideryPrices] = useState<Record<number, { full: number; half: number; tail: number }>>({});
  
  // 密码修改相关
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  
  // 添加工人相关
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [addingWorker, setAddingWorker] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [currentMonth]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/worker-stats?month=${currentMonth}`);
      const data = await res.json();
      setStats(data.stats || []);
      setTypeStats(data.typeStats || []);
      setTotal(data.total || { total_pieces: 0, total_salary: 0 });
      
      // 初始化编辑价格
      const prices: Record<number, number> = {};
      const sewingPrices: Record<number, { full: number; half: number; quarter: number }> = {};
      const embroideryPrices: Record<number, { full: number; half: number; tail: number }> = {};
      (data.stats || []).forEach((stat: WorkerStat) => {
        prices[stat.id] = stat.price_per_piece;
        sewingPrices[stat.id] = {
          full: stat.sewing_full || 16,
          half: stat.sewing_half || 8,
          quarter: stat.sewing_quarter || 4
        };
        embroideryPrices[stat.id] = {
          full: stat.embroidery_full || 8,
          half: stat.embroidery_half || 4,
          tail: stat.embroidery_tail || 4
        };
      });
      setEditingPrices(prices);
      setEditingSewingPrices(sewingPrices);
      setEditingEmbroideryPrices(embroideryPrices);
    } catch (error) {
      console.error('获取工人统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = async (workerId: number) => {
    try {
      const sewingPrices = editingSewingPrices[workerId] || { full: 16, half: 8, quarter: 4 };
      const embroideryPrices = editingEmbroideryPrices[workerId] || { full: 8, half: 4, tail: 4 };
      
      const res = await fetch('/api/worker-stats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: workerId,
          price_per_piece: editingPrices[workerId],
          sewing_full: sewingPrices.full,
          sewing_half: sewingPrices.half,
          sewing_quarter: sewingPrices.quarter,
          embroidery_full: embroideryPrices.full,
          embroidery_half: embroideryPrices.half,
          embroidery_tail: embroideryPrices.tail,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('工价更新成功');
        fetchStats();
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const updatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('密码长度至少6位');
      return;
    }
    
    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('密码已更新');
        setShowPasswordModal(false);
        setNewPassword('');
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    } finally {
      setSavingPassword(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loginTime');
    router.push('/login');
  };

  const addWorker = async () => {
    if (!newWorkerName.trim()) {
      toast.error('请输入工人姓名');
      return;
    }
    
    setAddingWorker(true);
    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkerName.trim() }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('工人已添加');
        setShowAddWorkerModal(false);
        setNewWorkerName('');
        fetchStats();
      } else {
        toast.error(data.error || '添加失败');
      }
    } catch (error) {
      toast.error('添加失败');
    } finally {
      setAddingWorker(false);
    }
  };

  const deleteWorker = async (workerId: number) => {
    if (!confirm('确定要删除这个工人吗？')) return;
    
    try {
      const res = await fetch(`/api/workers?id=${workerId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('工人已删除');
        fetchStats();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 获取每个工人的工种统计
  const getWorkerTypeStats = (workerName: string) => {
    return typeStats.filter(ts => ts.name === workerName);
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
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center"
              onClick={() => setShowPasswordModal(true)}
            >
              <Lock className="w-6 h-6 text-blue-600" />
              <span className="text-sm mt-2">修改密码</span>
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
            <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                工人计件统计 ({currentMonth})
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddWorkerModal(true)}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                添加工人
              </Button>
            </div>
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
                    <span className="text-sm text-gray-600">总工费</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(total.total_salary)}
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
                    
                    {/* 工种分类统计 */}
                    {getWorkerTypeStats(stat.name).length > 0 && (
                      <div className="text-xs text-gray-500 space-y-1 pl-2 border-l-2 border-blue-200">
                        {getWorkerTypeStats(stat.name).map((ts, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{ts.worker_type}: {ts.piece_count}件</span>
                            <span className="text-green-600">{formatCurrency(ts.total_fee)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* 车工工价设置 */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700">车工工价（元/套）</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 w-12">全套:</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editingSewingPrices[stat.id]?.full || 16}
                          onChange={e => setEditingSewingPrices(prev => ({
                            ...prev,
                            [stat.id]: { ...prev[stat.id], full: parseInt(e.target.value) || 0 }
                          }))}
                          className="h-7 w-16 text-xs"
                        />
                        <span className="text-gray-500 w-12">半套:</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editingSewingPrices[stat.id]?.half || 8}
                          onChange={e => setEditingSewingPrices(prev => ({
                            ...prev,
                            [stat.id]: { ...prev[stat.id], half: parseInt(e.target.value) || 0 }
                          }))}
                          className="h-7 w-16 text-xs"
                        />
                        <span className="text-gray-500 w-16">四分之一:</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editingSewingPrices[stat.id]?.quarter || 4}
                          onChange={e => setEditingSewingPrices(prev => ({
                            ...prev,
                            [stat.id]: { ...prev[stat.id], quarter: parseInt(e.target.value) || 0 }
                          }))}
                          className="h-7 w-16 text-xs"
                        />
                      </div>
                    </div>
                    
                    {/* 绣线工价设置 */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700">绣线工价（元/套）</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 w-12">全套:</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editingEmbroideryPrices[stat.id]?.full || 8}
                          onChange={e => setEditingEmbroideryPrices(prev => ({
                            ...prev,
                            [stat.id]: { ...prev[stat.id], full: parseInt(e.target.value) || 0 }
                          }))}
                          className="h-7 w-16 text-xs"
                        />
                        <span className="text-gray-500 w-12">半套:</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editingEmbroideryPrices[stat.id]?.half || 4}
                          onChange={e => setEditingEmbroideryPrices(prev => ({
                            ...prev,
                            [stat.id]: { ...prev[stat.id], half: parseInt(e.target.value) || 0 }
                          }))}
                          className="h-7 w-16 text-xs"
                        />
                        <span className="text-gray-500 w-12">尾垫:</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={editingEmbroideryPrices[stat.id]?.tail || 4}
                          onChange={e => setEditingEmbroideryPrices(prev => ({
                            ...prev,
                            [stat.id]: { ...prev[stat.id], tail: parseInt(e.target.value) || 0 }
                          }))}
                          className="h-7 w-16 text-xs"
                        />
                      </div>
                    </div>
                    
                    {/* 保存按钮 */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-8"
                        onClick={() => updatePrice(stat.id)}
                      >
                        <Save className="w-3 h-3 mr-1" />
                        保存工价
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-red-600"
                        onClick={() => deleteWorker(stat.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* 退出登录 */}
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={logout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          退出登录
        </Button>
      </div>

      {/* 密码修改模态框 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="font-semibold">修改登录密码</h2>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <Label className="text-sm">新密码</Label>
                <Input 
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="输入新密码（至少6位）"
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button 
                  onClick={updatePassword}
                  disabled={savingPassword}
                  className="flex-1"
                >
                  {savingPassword ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加工人模态框 */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="font-semibold">添加车工人员</h2>
              <button 
                onClick={() => setShowAddWorkerModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <Label className="text-sm">工人姓名</Label>
                <Input 
                  value={newWorkerName}
                  onChange={e => setNewWorkerName(e.target.value)}
                  placeholder="如：黄姐、雨婷、阿霞"
                  className="mt-2"
                />
              </div>
              <div className="text-xs text-gray-500">
                新工人将使用默认工价：车工全套16元、半套8元、四分之一套4元；绣线全套8元、半套4元、尾垫4元
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddWorkerModal(false)}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button 
                  onClick={addWorker}
                  disabled={addingWorker}
                  className="flex-1"
                >
                  {addingWorker ? '添加中...' : '添加'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-6 h-12">
          <Link href="/" className="flex flex-col items-center justify-center text-gray-600">
            <Home className="w-5 h-5" />
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
          <Link href="/today-query" className="flex flex-col items-center justify-center text-gray-600">
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs mt-1">今日</span>
          </Link>
          <Link href="/more" className="flex flex-col items-center justify-center text-blue-600">
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-xs mt-1">更多</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}