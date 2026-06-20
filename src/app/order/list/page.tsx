'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Search, Filter, ChevronRight, RefreshCw, Truck, Calendar, List } from 'lucide-react';
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

const statusOptions = ['全部', '待裁剪', '待生产', '已完成', '已发货'];

function OrderListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    customer: searchParams.get('customer') || '',
    status: searchParams.get('status') || '全部',
    date: searchParams.get('date') || '',
  });
  
  // 当天/全部切换
  const [showTodayOnly, setShowTodayOnly] = useState(true);
  
  // 勾选的订单ID
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
  // 发货按钮状态
  const [shipping, setShipping] = useState(false);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastOrderCountRef = useRef<number>(0);

  // 获取当天日期
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    
    try {
      const params = new URLSearchParams();
      if (filters.customer) params.append('customer', filters.customer);
      if (filters.status && filters.status !== '全部') params.append('status', filters.status);
      
      // 根据当天/全部切换设置日期筛选
      if (showTodayOnly) {
        params.append('date', getTodayDate());
      } else if (filters.date) {
        params.append('date', filters.date);
      }
      
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      const newOrders = data.orders || [];
      
      // 检测是否有新订单
      if (newOrders.length > lastOrderCountRef.current && lastOrderCountRef.current > 0) {
        console.log('检测到新订单');
      }
      lastOrderCountRef.current = newOrders.length;
      
      setOrders(newOrders);
      // 刷新后清空勾选
      setSelectedIds(new Set());
    } catch (error) {
      console.error('获取订单列表失败:', error);
    } finally {
      if (showLoading) setLoading(false);
      else setRefreshing(false);
    }
  }, [filters, showTodayOnly]);

  useEffect(() => {
    fetchOrders(true);
    
    pollingRef.current = setInterval(() => fetchOrders(false), 30000);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchOrders]);

  useEffect(() => {
    const handleFocus = () => fetchOrders(false);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchOrders]);

  const handleRefresh = () => fetchOrders(false);

  const handleReset = () => {
    setFilters({
      customer: '',
      status: '全部',
      date: '',
    });
  };

  // 切换当天/全部
  const toggleShowMode = () => {
    setShowTodayOnly(!showTodayOnly);
    setSelectedIds(new Set());
  };

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
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map(o => o.id)));
    }
  };

  // 发送到发货
  const handleShipSelected = async () => {
    if (selectedIds.size === 0) return;
    
    setShipping(true);
    try {
      const res = await fetch('/api/orders/batch-ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedIds) }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        // 刷新列表
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
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* 顶部标题 */}
      <div className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-center flex-1">订单列表</h1>
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

      {/* 当天/全部切换 */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="flex items-center justify-between">
          <Button
            variant={showTodayOnly ? 'default' : 'outline'}
            size="sm"
            onClick={toggleShowMode}
            className={showTodayOnly ? 'bg-blue-600' : ''}
          >
            <Calendar className="w-4 h-4 mr-1" />
            当天订单
          </Button>
          <Button
            variant={!showTodayOnly ? 'default' : 'outline'}
            size="sm"
            onClick={toggleShowMode}
            className={!showTodayOnly ? 'bg-blue-600' : ''}
          >
            <List className="w-4 h-4 mr-1" />
            全部订单
          </Button>
        </div>
        {showTodayOnly && (
          <div className="text-xs text-gray-500 mt-2 text-center">
            当前显示：{getTodayDate()} 的订单
          </div>
        )}
      </div>

      {/* 筛选区域（仅全部模式下显示） */}
      {!showTodayOnly && (
        <div className="px-4 py-3 bg-white border-b sticky top-12 z-10">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">筛选条件</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input
              placeholder="客户名称"
              value={filters.customer}
              onChange={e => setFilters(prev => ({ ...prev, customer: e.target.value }))}
              className="h-9"
            />
            <Select
              value={filters.status}
              onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="订单状态" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filters.date}
              onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="h-9"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="mt-2 w-full"
          >
            清除筛选
          </Button>
        </div>
      )}

      {/* 全选操作栏 */}
      {displayOrders.length > 0 && (
        <div className="px-4 py-2 bg-gray-100 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.size === displayOrders.length && displayOrders.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-gray-600">
              全选 ({selectedIds.size}/{displayOrders.length})
            </span>
          </div>
          <span className="text-xs text-gray-500">
            点击订单卡片可勾选
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
            <p>{showTodayOnly ? '今天暂无订单' : '暂无订单'}</p>
          </div>
        ) : (
          displayOrders.map(order => (
            <div 
              key={order.id} 
              className="relative"
              onClick={() => toggleSelect(order.id)}
            >
              <Card className={`shadow-sm transition-shadow cursor-pointer ${
                selectedIds.has(order.id) ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
              }`}>
                <CardContent className="p-4">
                  {/* 勾选框 */}
                  <div className="absolute top-3 left-3">
                    <Checkbox
                      checked={selectedIds.has(order.id)}
                      onCheckedChange={() => toggleSelect(order.id)}
                    />
                  </div>

                  {/* 订单号和日期 */}
                  <div className="flex justify-between items-start mb-2 pl-8">
                    <div>
                      <div className="font-semibold text-blue-600">{order.order_no}</div>
                      <div className="text-xs text-gray-500">{order.date}</div>
                    </div>
                    <Link 
                      href={`/order/detail?id=${order.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>

                  {/* 客户和车型 */}
                  <div className="flex justify-between items-center mb-2 pl-8">
                    <div className="text-sm">
                      <span className="font-medium">{order.customer_name}</span>
                      <span className="text-gray-500 ml-2">
                        {order.brand} {order.model}
                      </span>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {order.product_type}
                    </span>
                  </div>

                  {/* 版型号和划线 */}
                  <div className="flex gap-2 text-xs text-gray-500 mb-2 pl-8">
                    {order.version_no && (
                      <span className="bg-blue-50 px-2 py-1 rounded">版号: {order.version_no}</span>
                    )}
                    {order.line_mark && (
                      <span className="bg-purple-50 px-2 py-1 rounded">划线: {order.line_mark}</span>
                    )}
                  </div>

                  {/* 金额和状态 */}
                  <div className="flex justify-between items-center pl-8">
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
            </div>
          ))
        )}
      </div>

      {/* 底部发货按钮 */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-white border-t shadow-lg z-20">
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleShipSelected}
            disabled={shipping}
          >
            <Truck className="w-4 h-4 mr-2" />
            {shipping ? '正在发货...' : `发送到发货 (${selectedIds.size} 个订单)`}
          </Button>
        </div>
      )}

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