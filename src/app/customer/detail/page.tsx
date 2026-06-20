'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Package } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { formatCurrency } from '@/lib/utils';

interface Order {
  id: number;
  order_no: string;
  date: string;
  brand: string;
  model: string;
  product_type: string;
  total_price: number;
  status: string;
  payment_status: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
}

interface CustomerDetailData {
  customer: Customer;
  orders: Order[];
  totalOrders: { count: number; total: number };
}

function CustomerDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('id');
  
  const [data, setData] = useState<CustomerDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetail();
    }
  }, [customerId]);

  const fetchCustomerDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer?id=${customerId}`);
      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error('获取客户详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '待裁剪': return 'bg-yellow-500';
      case '待生产': return 'bg-blue-500';
      case '已完成': return 'bg-green-500';
      case '已发货': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case '已付': return 'bg-green-500';
      case '代收': return 'bg-blue-500';
      case '未付': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!data || !data.customer) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-blue-600 text-white px-4 py-4">
          <h1 className="text-lg font-semibold text-center">客户详情</h1>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>客户不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部标题 */}
      <div className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">客户详情</h1>
        <div />
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 基本信息 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{data.customer.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-500">电话：</span>
              <span>{data.customer.phone || '无'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">
                <span className="text-gray-500">订单数：</span>
                <span className="font-bold text-blue-600">{data.totalOrders.count}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">总金额：</span>
                <span className="font-bold text-blue-600">{formatCurrency(data.totalOrders.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 历史订单 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">历史订单</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.orders.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">暂无订单</div>
            ) : (
              data.orders.map(order => (
                <div 
                  key={order.id}
                  className="p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                  onClick={() => router.push(`/order/detail?id=${order.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-blue-600">{order.order_no}</div>
                      <div className="text-xs text-gray-500">{order.date}</div>
                    </div>
                    <div className="flex gap-1">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Badge className={getPaymentColor(order.payment_status)}>
                        {order.payment_status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {order.brand} {order.model}
                    </div>
                    <div className="font-bold text-blue-600">
                      {formatCurrency(order.total_price)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* 底部导航 */}
      <BottomNav current="more" />
    </div>
  );
}

export default function CustomerDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    }>
      <CustomerDetailContent />
    </Suspense>
  );
}