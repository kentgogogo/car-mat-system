'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, User, Package } from 'lucide-react';
import { toast } from 'sonner';

interface ProductionDetail {
  id: number;
  production_no: string;
  order_no: string;
  product_info: string;
  quantity: number;
  status: string;
  customer_name: string;
  brand: string;
  model: string;
  year_style: string;
  lower_material: string;
  upper_material: string;
  craft: string;
  color: string;
}

interface Worker {
  id: number;
  name: string;
  price_per_piece: number;
}

export default function WorkerCompletePage() {
  const searchParams = useSearchParams();
  const productionId = searchParams.get('id');
  
  const [production, setProduction] = useState<ProductionDetail | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (productionId) {
      fetchProductionDetail();
      fetchWorkers();
    }
  }, [productionId]);

  const fetchProductionDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/production?id=${productionId}`);
      const data = await res.json();
      setProduction(data.production);
      
      if (data.production?.status === '已完成') {
        toast.info('该订单已完成生产');
      }
    } catch (error) {
      console.error('获取生产详情失败:', error);
      toast.error('获取生产信息失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await fetch('/api/workers');
      const data = await res.json();
      setWorkers(data.workers || []);
    } catch (error) {
      console.error('获取工人列表失败:', error);
    }
  };

  const handleComplete = async () => {
    if (!selectedWorker) {
      toast.error('请选择工人姓名');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/production', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productionId,
          worker_name: selectedWorker,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('已完成生产确认');
        fetchProductionDetail();
      } else {
        toast.error('提交失败');
      }
    } catch (error) {
      toast.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!production) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-green-600 text-white px-4 py-4">
          <h1 className="text-lg font-semibold text-center">工人计件</h1>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>生产记录不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部标题 */}
      <div className="bg-green-600 text-white px-4 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-center">工人计件确认</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 订单状态 */}
        <div className="flex justify-center">
          <Badge 
            className={production.status === '已完成' ? 'bg-green-500' : 'bg-blue-500'}
          >
            {production.status}
          </Badge>
        </div>

        {/* 订单基本信息 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">订单信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-500">订单号：</span>
              <span className="font-medium text-blue-600">{production.order_no}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">生产编号：</span>
              <span className="font-medium">{production.production_no}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">客户：</span>
              <span>{production.customer_name}</span>
            </div>
          </CardContent>
        </Card>

        {/* 车辆信息 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">车辆信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-500">车型：</span>
              <span className="font-medium">
                {production.brand} {production.model} {production.year_style}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 产品信息 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">产品信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-500">类型：</span>
              <span>{production.product_info}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">下层材料：</span>
              <span>{production.lower_material || '-'}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">上层材料：</span>
              <span>{production.upper_material || '-'}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">工艺：</span>
              <span>{production.craft || '-'}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">颜色：</span>
              <span>{production.color || '-'}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">数量：</span>
              <span className="font-bold text-blue-600">{production.quantity}</span>
            </div>
          </CardContent>
        </Card>

        {/* 工人选择 */}
        {production.status !== '已完成' && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">选择工人</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedWorker}
                onValueChange={setSelectedWorker}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择工人姓名" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map(worker => (
                    <SelectItem key={worker.id} value={worker.name}>
                      {worker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleComplete}
                disabled={submitting || !selectedWorker}
                className="w-full h-12 bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <span>提交中...</span>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    确认完成
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 已完成提示 */}
        {production.status === '已完成' && (
          <Card className="shadow-sm bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-2" />
                <span className="text-green-600 font-medium">已完成生产</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}