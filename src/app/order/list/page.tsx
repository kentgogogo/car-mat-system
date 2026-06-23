'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Package, Truck, Calendar, TrendingUp, DollarSign, 
  RefreshCw, ChevronRight, Eye, CheckCircle
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import dynamic from 'next/dynamic';

// 动态导入折线图组件
const LineChart = dynamic(() => import('@/components/OrderTrendChart'), { ssr: false });

interface Order {
  id: number;
  order_no: string;
  date: string;
  customer_name: string;
  customer_phone: string;
  logistics: string;
  brand: string;
  model: string;
  year_style: string;
  product_type: string;
  version_no: string;
  line_mark: string;
  vin_code: string | null;
  tail_version_no: string | null;
  set_type: string;
  embroidery_type: string;
  sewing_fee: number;
  embroidery_fee: number;
  lower_material: string;
  upper_material: string;
  craft: string;
  auxiliary: string;
  tail_mat: string;
  color: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_status: string;
  remark: string;
  status: string;
  created_at: string;
  updated_at: string;
  tracking_no: string;
}

function OrderListContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [shipping, setShipping] = useState(false);
  
  // 日期筛选状态
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  
  // 销售统计状态
  const [showStats, setShowStats] = useState(false);
  const [statsStartDate, setStatsStartDate] = useState<string>('');
  const [statsEndDate, setStatsEndDate] = useState<string>('');
  const [totalSales, setTotalSales] = useState<number>(0);
  
  // 趋势图状态
  const [showTrend, setShowTrend] = useState(false);

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    
    try {
      let url = '/api/orders';
      if (showHistory && selectedDate) {
        url += `?date=${selectedDate}`;
      } else if (!showHistory) {
        // 默认显示当天
        const today = new Date().toISOString().split('T')[0];
        url += `?date=${today}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('获取订单列表失败:', error);
    } finally {
      if (showLoading) setLoading(false);
      else setRefreshing(false);
    }
  }, [showHistory, selectedDate]);

  useEffect(() => {
    fetchOrders(true);
    
    // 30秒轮询刷新
    const interval = setInterval(() => fetchOrders(false), 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // 计算销售总额
  const calculateSales = async () => {
    if (!statsStartDate || !statsEndDate) {
      alert('请选择起始日期和结束日期');
      return;
    }
    
    try {
      const res = await fetch(`/api/orders/stats?start=${statsStartDate}&end=${statsEndDate}`);
      const data = await res.json();
      setTotalSales(data.totalSales || 0);
    } catch (error) {
      console.error('计算销售总额失败:', error);
    }
  };

  // 切换选中状态
  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map(o => o.id)));
    }
  };

  // 一键发货
  const handleShipSelected = async () => {
    if (selectedIds.size === 0) {
      alert('请先勾选要发货的订单');
      return;
    }
    
    setShipping(true);
    try {
      const res = await fetch('/api/orders/batch-ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedIds) })
      });
      
      const data = await res.json();
      if (data.success) {
        alert(`已将 ${data.shippedCount} 个订单标记为已发货`);
        setSelectedIds(new Set());
        fetchOrders(false);
      } else {
        alert(data.error || '发货失败');
      }
    } catch (error) {
      console.error('批量发货失败:', error);
      alert('发货失败');
    } finally {
      setShipping(false);
    }
  };

  // 获取今天日期字符串
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  // 格式化日期显示
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  // 状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case '待裁剪': return 'bg-yellow-100 text-yellow-700';
      case '待生产': return 'bg-blue-100 text-blue-700';
      case '已完成': return 'bg-green-100 text-green-700';
      case '已发货': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部标题栏 */}
      <div className="bg-blue-500 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">订单管理</h1>
          {!showHistory && (
            <Badge className="bg-blue-400 text-white text-xs">当天</Badge>
          )}
          {showHistory && selectedDate && (
            <Badge className="bg-blue-400 text-white text-xs">{formatDateDisplay(selectedDate)}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-white text-blue-500 border-blue-400 h-7"
            onClick={() => setShowTrend(!showTrend)}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            趋势
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-white text-blue-500 border-blue-400 h-7"
            onClick={() => setShowStats(!showStats)}
          >
            <DollarSign className="w-3 h-3 mr-1" />
            统计
          </Button>
          {selectedIds.size > 0 && (
            <Button 
              size="sm" 
              className="bg-green-500 hover:bg-green-600 text-white h-7"
              onClick={handleShipSelected}
              disabled={shipping}
            >
              {shipping ? '发货中...' : '一键发货'}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white h-7 w-7 p-0"
            onClick={() => fetchOrders(false)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 趋势图区域 */}
      {showTrend && (
        <div className="bg-white mx-4 mt-3 rounded-lg p-3 shadow-sm">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            订单趋势
          </h3>
          <LineChart />
        </div>
      )}

      {/* 销售统计区域 */}
      {showStats && (
        <div className="bg-white mx-4 mt-3 rounded-lg p-3 shadow-sm">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-blue-500" />
            销售总额统计
          </h3>
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500">起始日期</label>
              <Input 
                type="date" 
                value={statsStartDate}
                onChange={e => setStatsStartDate(e.target.value)}
                className="h-8 mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">结束日期</label>
              <Input 
                type="date" 
                value={statsEndDate}
                onChange={e => setStatsEndDate(e.target.value)}
                className="h-8 mt-1"
              />
            </div>
            <Button 
              size="sm" 
              className="bg-blue-500 text-white h-8 mt-4"
              onClick={calculateSales}
            >
              计算
            </Button>
          </div>
          {totalSales > 0 && (
            <div className="text-center py-2 bg-green-50 rounded">
              <span className="text-lg font-bold text-green-600">¥{totalSales.toFixed(2)}</span>
              <span className="text-xs text-gray-500 ml-1">销售总额</span>
            </div>
          )}
        </div>
      )}

      {/* 日期选择器 */}
      <div className="bg-white mx-4 mt-3 rounded-lg p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">日期筛选：</span>
          <Button 
            size="sm" 
            variant={!showHistory ? "default" : "outline"}
            className={`h-7 ${!showHistory ? 'bg-blue-500 text-white' : ''}`}
            onClick={() => { setShowHistory(false); setSelectedDate(''); }}
          >
            当天
          </Button>
          <Button 
            size="sm" 
            variant={showHistory ? "default" : "outline"}
            className={`h-7 ${showHistory ? 'bg-blue-500 text-white' : ''}`}
            onClick={() => setShowHistory(true)}
          >
            历史
          </Button>
          {showHistory && (
            <Input 
              type="date" 
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="h-7 w-auto flex-1"
            />
          )}
        </div>
      </div>

      {/* 全选栏 */}
      <div className="bg-white mx-4 mt-3 rounded-lg px-3 py-2 shadow-sm flex items-center gap-2">
        <Checkbox 
          checked={selectedIds.size === orders.length && orders.length > 0}
          onCheckedChange={toggleSelectAll}
        />
        <span className="text-sm text-gray-600">
          已选 {selectedIds.size}/{orders.length} 条
        </span>
      </div>

      {/* 订单列表 */}
      <div className="px-4 mt-3 space-y-3">
        {orders.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {showHistory ? '该日期暂无订单' : '今天暂无订单'}
          </div>
        ) : (
          orders.map(order => (
            <Card 
              key={order.id}
              className={`shadow-sm ${selectedIds.has(order.id) ? 'border-2 border-blue-500 bg-blue-50' : ''}`}
            >
              <CardContent className="p-3">
                {/* 第一行：勾选框 + 订单号 + 详情 */}
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox 
                    checked={selectedIds.has(order.id)}
                    onCheckedChange={() => toggleSelect(order.id)}
                  />
                  <span className="font-medium text-blue-600">{order.order_no}</span>
                  <Link href={`/order/detail?id=${order.id}`} className="ml-auto">
                    <Button variant="ghost" size="sm" className="h-7 text-gray-500">
                      <Eye className="w-3 h-3 mr-1" />
                      详情
                    </Button>
                  </Link>
                </div>

                {/* 第二行：日期 + 客户 */}
                <div className="text-sm text-gray-600 mb-1">
                  <span>{formatDateDisplay(order.date)}</span>
                  <span className="mx-2">|</span>
                  <span>{order.customer_name}</span>
                  {order.customer_phone && <span className="text-gray-400 ml-1">({order.customer_phone})</span>}
                </div>

                {/* 第三行：车型 */}
                <div className="text-sm text-gray-600 mb-1">
                  {order.brand} {order.model} {order.year_style}
                  {order.product_type && <Badge className="ml-2 bg-purple-100 text-purple-700 text-xs">{order.product_type}</Badge>}
                </div>

                {/* 第四行：版号/划线 */}
                <div className="text-sm text-gray-500 mb-1 flex gap-2">
                  {order.version_no && <span>版号: {order.version_no}</span>}
                  {order.line_mark && <span>划线: {order.line_mark}</span>}
                  {order.tail_version_no && <span>后舱: {order.tail_version_no}</span>}
                </div>

                {/* 第五行：金额 + 状态 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-600">
                    ¥{(order.total_price || order.unit_price * order.quantity || 0).toFixed(2)}
                  </span>
                  <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                  {order.payment_status && (
                    <Badge className={`text-xs ${order.payment_status === '已付' ? 'bg-green-100 text-green-700' : order.payment_status === '代收' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {order.payment_status}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <BottomNav current="list" />
    </div>
  );
}

export default function OrderListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">加载中...</div>}>
      <OrderListContent />
    </Suspense>
  );
}