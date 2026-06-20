'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, Plus, ShoppingBag, XCircle, RefreshCw, FileText, Wrench, Users, BarChart3, ClipboardList } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface QueryLog {
  id: number;
  vehicle_model: string;
  year: string;
  vin_code: string | null;
  product_type: string;
  pattern_code: string;
  guide_info: string | null;
  query_time: string;
  order_status: string;
}

interface Stats {
  total: number;
  ordered: number;
  unordered: number;
}

export default function TodayQueryPage() {
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, ordered: 0, unordered: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // 新增查询表单
  const [formData, setFormData] = useState({
    vehicle_model: '',
    year: '',
    vin_code: '',
    product_type: '脚垫',
    pattern_code: '',
    guide_info: '',
  });

  // 获取今日查询记录
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/query-log');
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('获取查询记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // 添加查询记录
  const handleSubmit = async () => {
    if (!formData.vehicle_model || !formData.year || !formData.pattern_code) {
      return;
    }
    
    try {
      const response = await fetch('/api/query-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (data.success) {
        setDialogOpen(false);
        setFormData({
          vehicle_model: '',
          year: '',
          vin_code: '',
          product_type: '脚垫',
          pattern_code: '',
          guide_info: '',
        });
        fetchLogs();
      }
    } catch (error) {
      console.error('添加查询记录失败:', error);
    }
  };

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 顶部标题栏 */}
      <div className="bg-blue-500 text-white p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-center">今日查询记录</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-gray-600 mt-1">总查询</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.ordered}</div>
              <div className="text-xs text-gray-600 mt-1">已下单</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.unordered}</div>
              <div className="text-xs text-gray-600 mt-1">未下单</div>
            </CardContent>
          </Card>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button onClick={fetchLogs} variant="outline" className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                添加记录
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>添加查询记录</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_model">车型</Label>
                  <Input
                    id="vehicle_model"
                    placeholder="如：宝马5系"
                    value={formData.vehicle_model}
                    onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">年款</Label>
                  <Input
                    id="year"
                    placeholder="如：2016"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin_code">VIN码后四位（可选）</Label>
                  <Input
                    id="vin_code"
                    placeholder="如：1234"
                    maxLength={4}
                    value={formData.vin_code}
                    onChange={(e) => setFormData({ ...formData, vin_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_type">产品类型</Label>
                  <Select
                    value={formData.product_type}
                    onValueChange={(value) => setFormData({ ...formData, product_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="脚垫">脚垫</SelectItem>
                      <SelectItem value="软包">软包</SelectItem>
                      <SelectItem value="后仓">后仓</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pattern_code">版型号</Label>
                  <Input
                    id="pattern_code"
                    placeholder="如：BM1127R"
                    value={formData.pattern_code}
                    onChange={(e) => setFormData({ ...formData, pattern_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guide_info">区分条件</Label>
                  <Input
                    id="guide_info"
                    placeholder="如：滑轨36cm"
                    value={formData.guide_info}
                    onChange={(e) => setFormData({ ...formData, guide_info: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                <Button onClick={handleSubmit}>保存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 查询记录列表 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <ClipboardList className="w-4 h-4 mr-2" />
              查询记录（按时间倒序）
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">加载中...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">今日暂无查询记录</div>
            ) : (
              <div className="divide-y">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{log.vehicle_model}</div>
                      <Badge
                        variant={log.order_status === '已下单' ? 'default' : 'destructive'}
                        className={log.order_status === '已下单' ? 'bg-green-500' : 'bg-red-500'}
                      >
                        {log.order_status === '已下单' ? (
                          <ShoppingBag className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {log.order_status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                      <div>年款：{log.year}</div>
                      <div>VIN后四位：{log.vin_code || '-'}</div>
                      <div>产品：{log.product_type}</div>
                      <div>版型号：{log.pattern_code}</div>
                      <div className="col-span-2">时间：{formatTime(log.query_time)}</div>
                    </div>
                    {log.guide_info && (
                      <div className="mt-1 text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        区分条件：{log.guide_info}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 底部导航栏 */}
      <BottomNav current="shipping" />
    </div>
  );
}