'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Package, ClipboardList, Home, Plus, List, Factory, MoreHorizontal } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

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
}

const statusOptions = ['待裁剪', '待生产', '已完成', '已发货'];

function OrderDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?id=${orderId}`);
      const data = await res.json();
      setOrder(data.order);
    } catch (error) {
      console.error('获取订单详情失败:', error);
      toast.error('获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('状态更新成功');
        fetchOrder();
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const deleteOrder = async () => {
    if (!confirm('确定要删除这个订单吗？')) return;
    
    try {
      const res = await fetch(`/api/orders?id=${orderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('订单已删除');
        router.push('/order/list');
      }
    } catch (error) {
      toast.error('删除失败');
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

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-blue-600 text-white px-4 py-4">
          <h1 className="text-lg font-semibold text-center">订单详情</h1>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>订单不存在</p>
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
        <h1 className="text-lg font-semibold">订单详情</h1>
        <div className="flex gap-2">
          <Link href={`/order/edit?id=${order.id}`}>
            <Edit className="w-5 h-5" />
          </Link>
          <button onClick={deleteOrder}>
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 订单基本信息 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">{order.order_no}</CardTitle>
              <div className="flex gap-1">
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
                <Badge className={getPaymentColor(order.payment_status)}>
                  {order.payment_status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">下单日期：</span>{order.date}</div>
              <div><span className="text-gray-500">客户：</span>{order.customer_name}</div>
              <div><span className="text-gray-500">电话：</span>{order.customer_phone || '-'}</div>
              <div><span className="text-gray-500">物流：</span>{order.logistics || '-'}</div>
            </div>
          </CardContent>
        </Card>

        {/* 车辆信息 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">车辆信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">品牌：</span>{order.brand}</div>
              <div><span className="text-gray-500">车型：</span>{order.model}</div>
              <div><span className="text-gray-500">年款：</span>{order.year_style || '-'}</div>
            </div>
          </CardContent>
        </Card>

        {/* 产品信息 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">产品信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">类型：</span>{order.product_type}</div>
              <div><span className="text-gray-500">版型号：</span>{order.version_no || '-'}</div>
              <div><span className="text-gray-500">划线：</span>{order.line_mark || '-'}</div>
              <div><span className="text-gray-500">套数类型：</span>{order.set_type || '全套'}</div>
              <div><span className="text-gray-500">绣线：</span>{order.embroidery_type || '无'}</div>
              <div><span className="text-gray-500">下层材料：</span>{order.lower_material || '-'}</div>
              <div><span className="text-gray-500">上层材料：</span>{order.upper_material || '-'}</div>
              <div><span className="text-gray-500">工艺：</span>{order.craft || '-'}</div>
              <div><span className="text-gray-500">辅料：</span>{order.auxiliary || '-'}</div>
              <div><span className="text-gray-500">尾垫：</span>{order.tail_mat || '-'}</div>
              <div><span className="text-gray-500">颜色：</span>{order.color || '-'}</div>
            </div>
          </CardContent>
        </Card>

        {/* 价格信息 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">价格信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div><span className="text-gray-500">数量：</span>{order.quantity}</div>
              <div><span className="text-gray-500">单价：</span>{formatCurrency(order.unit_price)}</div>
              <div className="font-bold text-blue-600">
                <span className="text-gray-500">总价：</span>{formatCurrency(order.total_price)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 工价信息 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">工价信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="p-3 bg-green-50 rounded-md">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">车工费：</span>
                  <span className="font-medium text-green-600">{formatCurrency(order.sewing_fee || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">绣线费：</span>
                  <span className="font-medium text-green-600">{formatCurrency(order.embroidery_fee || 0)}</span>
                </div>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-green-200">
                <span className="text-gray-600">合计工费：</span>
                <span className="font-bold text-green-600">
                  {formatCurrency((order.sewing_fee || 0) + (order.embroidery_fee || 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 备注 */}
        {order.remark && (
          <Card className="shadow-sm">
            <CardContent className="pt-4">
              <div className="text-sm">
                <span className="text-gray-500">备注：</span>
                <span className="mt-1 block">{order.remark}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 更新状态 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">更新订单状态</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={order.status}
              onValueChange={updateStatus}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

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
          <Link href="/more" className="flex flex-col items-center justify-center text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-xs mt-1">更多</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    }>
      <OrderDetailContent />
    </Suspense>
  );
}