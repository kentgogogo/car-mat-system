'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, RefreshCw, Truck, ChevronRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { formatCurrency } from '@/lib/utils';

interface Order {
  id: number;
  order_no: string;
  date: string;
  customer_name: string;
  brand: string;
  model: string;
  product_type: string;
  version_no: string;
  line_mark: string;
  total_price: number;
  status: string;
  payment_status: string;
}

function OrderListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 勾选的订单ID
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // 发货按钮状态
  const [shipping, setShipping] = useState(false);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 获取当天日期
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    
    try {
      // 只获取当天的订单
      const params = new URLSearchParams();
      params.append('date', getTodayDate());
      
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('获取订单列表失败:', error);
    } finally {
      if (showLoading) setLoading(false);
      else setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(true);
    
    // 每30秒自动刷新
    pollingRef.current = setInterval(() => fetchOrders(false), 30000);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchOrders]);

  // 页面聚焦时刷新
  useEffect(() => {
    const handleFocus = () => fetchOrders(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchOrders]);

  const handleRefresh = () => fetchOrders(false);

  // 勾选/取消勾选订单
  const toggleSelect = (orderId: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedIds(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.size === displayOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayOrders.map(o => o.id)));
    }
  };

  // 一键发货
  const handleShipSelected = async () => {
    if (selectedIds.size === 0) {
      alert('请先勾选订单');
      return;
    }
    
    setShipping(true);
    try {
      const res = await fetch('/api/orders/batch-ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedIds) }),
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
      console.error('发货失败:', error);
      alert('发货失败');
    } finally {
      setShipping(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '待裁剪': return 'bg-yellow-100 text-yellow-700';
      case '待生产': return 'bg-blue-100 text-blue-700';
      case '已完成': return 'bg-green-100 text-green-700';
      case '已发货': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case '已付': return 'bg-green-100 text-green-700';
      case '代收': return 'bg-blue-100 text-blue-700';
      case '未付': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 过滤掉已发货的订单（发货模块才显示已发货）
  const displayOrders = orders.filter(o => o.status !== '已发货');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部标题栏 */}
      <div className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">订单列表</h1>
          <span className="text-xs bg-blue-500 px-2 py-1 rounded">{getTodayDate()}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* 一键发货按钮 */}
          <Button
            variant="default"
            size="sm"
            onClick={handleShipSelected}
            disabled={shipping || selectedIds.size === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Truck className="w-4 h-4 mr-1" />
            {shipping ? '发货中...' : '一键发货'}
          </Button>
          {/* 刷新按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-white hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 全选栏 */}
      {displayOrders.length > 0 && (
        <div className="px-4 py-2 bg-gray-100 border-b flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size === displayOrders.length && displayOrders.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-gray-600">
            全选 ({selectedIds.size}/{displayOrders.length})
          </span>
        </div>
      )}

      {/* 订单列表 */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : displayOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>今天暂无订单</p>
          </div>
        ) : (
          displayOrders.map(order => (
            <Card 
              key={order.id} 
              className={`shadow-sm ${
                selectedIds.has(order.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
            >
              <CardContent className="p-4">
                {/* 第一行：勾选框 + 订单号 + 详情链接 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.has(order.id)}
                      onCheckedChange={() => toggleSelect(order.id)}
                    />
                    <span className="font-semibold text-blue-600">{order.order_no}</span>
                  </div>
                  <Link 
                    href={`/order/detail?id=${order.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>

                {/* 第二行：日期 + 客户 + 车型 */}
                <div className="flex justify-between items-center mb-2 text-sm">
                  <div>
                    <span className="text-gray-500">{order.date}</span>
                    <span className="mx-2">|</span>
                    <span className="font-medium">{order.customer_name}</span>
                    <span className="text-gray-500 ml-2">
                      {order.brand} {order.model}
                    </span>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {order.product_type}
                  </span>
                </div>

                {/* 第三行：版号 + 划线 */}
                <div className="flex gap-2 text-xs text-gray-500 mb-2">
                  {order.version_no && (
                    <span className="bg-blue-50 px-2 py-1 rounded">版号: {order.version_no}</span>
                  )}
                  {order.line_mark && (
                    <span className="bg-purple-50 px-2 py-1 rounded">划线: {order.line_mark}</span>
                  )}
                </div>

                {/* 第四行：金额 + 状态 */}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-600">
                    {formatCurrency(order.total_price)}
                  </span>
                  <div className="flex gap-1">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getPaymentColor(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 底部导航 */}
      <BottomNav current="list" />
    </div>
  );
}

export default function OrderListPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    }>
      <OrderListContent />
    </Suspense>
  );
}