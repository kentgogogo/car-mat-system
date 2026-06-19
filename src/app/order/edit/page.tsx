'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CheckCircle, Package } from 'lucide-react';
import { toast } from 'sonner';

const logisticsOptions = [
  '文达', '富恒', '先飞达', '快航道', '天正', '天佑', 
  '速音', '翁氏', '腾立', '南天', '亿达', '顺丰', 
  '八达', '南天A', '南天B', '南阳', '永盛达', '快递'
];

const productTypes = ['脚垫', '软包'];
const craftOptions = ['双针', '三针', '拼接'];
const auxiliaryOptions = ['普通扣', '魔术扣'];
const tailMatOptions = ['有', '无'];
const paymentOptions = ['代收', '已付', '未付'];

export default function EditOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    date: '',
    customer_name: '',
    customer_phone: '',
    logistics: '',
    brand: '',
    model: '',
    year_style: '',
    product_type: '脚垫',
    version_no: '',
    lower_material: '',
    upper_material: '',
    craft: '双针',
    auxiliary: '普通扣',
    tail_mat: '无',
    color: '',
    quantity: 1,
    unit_price: 0,
    payment_status: '未付',
    remark: '',
  });

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
      if (data.order) {
        const order = data.order;
        setFormData({
          date: order.date,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone || '',
          logistics: order.logistics || '',
          brand: order.brand,
          model: order.model,
          year_style: order.year_style || '',
          product_type: order.product_type,
          version_no: order.version_no || '',
          lower_material: order.lower_material || '',
          upper_material: order.upper_material || '',
          craft: order.craft || '双针',
          auxiliary: order.auxiliary || '普通扣',
          tail_mat: order.tail_mat || '无',
          color: order.color || '',
          quantity: order.quantity,
          unit_price: order.unit_price,
          payment_status: order.payment_status,
          remark: order.remark || '',
        });
      }
    } catch (error) {
      toast.error('获取订单信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.customer_name) {
      toast.error('请输入客户名称');
      return;
    }
    if (!formData.brand || !formData.model) {
      toast.error('请输入车辆品牌和车型');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(`/api/order/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('订单更新成功');
        router.push(`/order/detail?id=${orderId}`);
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      toast.error('更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">加载中...</div>
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
        <h1 className="text-lg font-semibold">编辑订单</h1>
        <Package className="w-5 h-5" />
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 基本信息 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">下单日期</Label>
              <Input 
                type="date"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">客户名称 *</Label>
              <Input 
                value={formData.customer_name}
                onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="输入客户名称"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">客户电话</Label>
              <Input 
                value={formData.customer_phone}
                onChange={e => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="输入客户电话"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">物流方式</Label>
              <Select 
                value={formData.logistics}
                onValueChange={value => setFormData(prev => ({ ...prev, logistics: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="选择物流方式" />
                </SelectTrigger>
                <SelectContent>
                  {logisticsOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 车辆信息 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">车辆信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">车辆品牌 *</Label>
              <Input 
                value={formData.brand}
                onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="如：宝马、奔驰、奥迪"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">车型 *</Label>
              <Input 
                value={formData.model}
                onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="如：X5、E300、A6"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">年款</Label>
              <Input 
                value={formData.year_style}
                onChange={e => setFormData(prev => ({ ...prev, year_style: e.target.value }))}
                placeholder="如：2024款"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* 产品信息 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">产品信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">产品类型</Label>
              <Select 
                value={formData.product_type}
                onValueChange={value => setFormData(prev => ({ ...prev, product_type: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">版型号</Label>
              <Input 
                value={formData.version_no}
                onChange={e => setFormData(prev => ({ ...prev, version_no: e.target.value }))}
                placeholder="输入版型号"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">下层材料</Label>
              <Input 
                value={formData.lower_material}
                onChange={e => setFormData(prev => ({ ...prev, lower_material: e.target.value }))}
                placeholder="输入下层材料"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">上层材料</Label>
              <Input 
                value={formData.upper_material}
                onChange={e => setFormData(prev => ({ ...prev, upper_material: e.target.value }))}
                placeholder="输入上层材料"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">工艺</Label>
              <Select 
                value={formData.craft}
                onValueChange={value => setFormData(prev => ({ ...prev, craft: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {craftOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">辅料</Label>
              <Select 
                value={formData.auxiliary}
                onValueChange={value => setFormData(prev => ({ ...prev, auxiliary: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {auxiliaryOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">尾垫</Label>
              <Select 
                value={formData.tail_mat}
                onValueChange={value => setFormData(prev => ({ ...prev, tail_mat: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tailMatOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">颜色</Label>
              <Input 
                value={formData.color}
                onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="输入颜色"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* 价格信息 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">价格信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">数量</Label>
              <Input 
                type="number"
                min="1"
                value={formData.quantity}
                onChange={e => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm">单价 (元)</Label>
              <Input 
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_price}
                onChange={e => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                className="mt-1"
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">总价</span>
                <span className="text-lg font-bold text-blue-600">
                  ¥{(formData.quantity * formData.unit_price).toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <Label className="text-sm">付款状态</Label>
              <Select 
                value={formData.payment_status}
                onValueChange={value => setFormData(prev => ({ ...prev, payment_status: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 备注 */}
        <Card className="shadow-sm">
          <CardContent className="pt-4">
            <Label className="text-sm">备注</Label>
            <Textarea 
              value={formData.remark}
              onChange={e => setFormData(prev => ({ ...prev, remark: e.target.value }))}
              placeholder="输入备注信息"
              className="mt-1"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <Button 
          onClick={handleSubmit}
          disabled={saving}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <span>保存中...</span>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              保存订单
            </>
          )}
        </Button>
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
          <Link href="/order/list" className="flex flex-col items-center justify-center text-gray-600">
            <Package className="w-5 h-5" />
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