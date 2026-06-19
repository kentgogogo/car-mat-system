'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Package, Search, Filter, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Order {
  id: number;
  order_no: string;
  date: string;
  customer_name: string;
  brand: string;
  model: string;
  product_type: string;
  total_price: number;
  status: string;
  payment_status: string;
}

const statusOptions = ['全部', '待裁剪', '待生产', '已完成', '已发货'];

export default function OrderListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    customer: searchParams.get('customer') || '',
    status: searchParams.get('status') || '全部',
    date: searchParams.get('date') || '',
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.customer) params.append('customer', filters.customer);
      if (filters.status && filters.status !== '全部') params.append('status', filters.status);
      if (filters.date) params.append('date', filters.date);
      
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('获取订单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const handleReset = () => {
    setFilters({
      customer: '',
      status: '全部',
      date: '',
    });
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部标题 */}
      <div className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-center">订单列表</h1>
      </div>

      {/* 筛选区域 */}
      <div className="px-4 py-3 bg-white border-b sticky top-12 z-10">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">筛选条件</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {/* 客户筛选 */}
          <Input
            placeholder="客户名称"
            value={filters.customer}
            onChange={e => setFilters(prev => ({ ...prev, customer: e.target.value }))}
            className="h-9"
          />
          
          {/* 状态筛选 */}
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
          
          {/* 日期筛选 */}
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

      {/* 订单列表 */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>暂无订单</p>
          </div>
        ) : (
          orders.map(order => (
            <Link key={order.id} href={`/order/detail?id=${order.id}`}>
              <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  {/* 订单号和日期 */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-blue-600">{order.order_no}</div>
                      <div className="text-xs text-gray-500">{order.date}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* 客户和车型 */}
                  <div className="flex justify-between items-center mb-2">
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

                  {/* 金额和状态 */}
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
            </Link>
          ))
        )}
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
          <Link href="/order/list" className="flex flex-col items-center justify-center text-blue-600">
            <Search className="w-5 h-5" />
            <span className="text-xs mt-1">订单</span>
          </Link>
          <Link href="/production" className="flex flex-col items-center justify-center text-gray-600">
            <Package className="w-5 h-5" />
            <span className="text-xs mt-1">生产</span>
          </Link>
          <Link href="/more" className="flex flex-col items-center justify-center text-gray-600">
            <Package className="w-5 h-5" />
            <span className="text-xs mt-1">更多</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}