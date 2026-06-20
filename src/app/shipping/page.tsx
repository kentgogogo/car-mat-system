'use client';

import { useState, useEffect } from 'react';
import { Package, Truck, User, Car } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';

interface ShippingItem {
  order_no: string;
  date: string;
  customer_name: string;
  customer_phone: string;
  logistics: string;
  is_collect: string;
  vehicle: string;
  lower_material: string;
  upper_material: string;
  tail_mat: string;
  quantity: number;
  remark: string;
}

const statusConfig = {
  '已发货': { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' }
};

export default function ShippingPage() {
  const [shippingList, setShippingList] = useState<ShippingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShippingList();
    // 每30秒自动刷新
    const interval = setInterval(fetchShippingList, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchShippingList = async () => {
    try {
      const res = await fetch('/api/shipping');
      const data = await res.json();
      setShippingList(data.shippingList || []);
    } catch (error) {
      console.error('获取发货列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-14">
      {/* 顶部标题栏 */}
      <header className="sticky top-0 bg-blue-600 text-white px-4 py-3 shadow-md z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Truck className="w-5 h-5" />
            发货列表
          </h1>
          <span className="text-sm bg-blue-500 px-2 py-1 rounded">
            共 {shippingList.length} 条
          </span>
        </div>
      </header>

      {/* 列表内容 */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : shippingList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>暂无发货记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shippingList.map((item) => (
              <Card key={item.order_no} className="shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  {/* 订单号和日期 */}
                  <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b">
                    <div className="text-sm">
                      <span className="text-gray-500">订单号：</span>
                      <span className="font-medium text-gray-800">{item.order_no}</span>
                    </div>
                    <div className="text-sm text-gray-500">{item.date}</div>
                  </div>
                  
                  {/* 主要信息 */}
                  <div className="px-4 py-3 space-y-2">
                    {/* 客户信息行 */}
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-800">{item.customer_name}</span>
                      {item.customer_phone && (
                        <span className="text-sm text-gray-500">{item.customer_phone}</span>
                      )}
                    </div>
                    
                    {/* 车型信息行 */}
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{item.vehicle}</span>
                      <span className="text-sm text-gray-500">× {item.quantity}</span>
                    </div>
                    
                    {/* 物流和代收行 */}
                    <div className="flex items-center gap-3">
                      {item.logistics && (
                        <Badge variant="outline" className="text-xs">
                          <Truck className="w-3 h-3 mr-1" />
                          {item.logistics}
                        </Badge>
                      )}
                      {item.is_collect === '是' && (
                        <Badge className="bg-blue-500 text-white text-xs">代收</Badge>
                      )}
                    </div>
                    
                    {/* 材料信息 */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {item.lower_material && (
                        <div className="text-gray-600">
                          <span className="text-gray-400">下层：</span>
                          {item.lower_material}
                        </div>
                      )}
                      {item.upper_material && (
                        <div className="text-gray-600">
                          <span className="text-gray-400">上层：</span>
                          {item.upper_material}
                        </div>
                      )}
                    </div>
                    
                    {/* 尾垫 */}
                    {item.tail_mat && (
                      <div className="text-sm text-gray-600">
                        <span className="text-gray-400">尾垫：</span>
                        {item.tail_mat}
                      </div>
                    )}
                    
                    {/* 备注 */}
                    {item.remark && (
                      <div className="text-sm text-gray-500 mt-1 pt-1 border-t border-gray-100">
                        备注：{item.remark}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <BottomNav current="shipping" />
    </div>
  );
}