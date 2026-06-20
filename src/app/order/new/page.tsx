'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Package, CheckCircle, ClipboardList, Home, Plus, List, Factory, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
  name: string;
  phone: string;
  logistics: string;
  is_collect: string;
  remark: string;
}

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
const setTypeOptions = ['全套', '半套', '四分之一套'];
const embroideryTypeOptions = ['无', '永恒', '穿梭', '群图'];

// 工价计算
const calculateFees = (productType: string, setType: string, embroideryType: string) => {
  const sewingPrices: Record<string, Record<string, number>> = {
    '软包': { '全套': 16, '半套': 8, '四分之一套': 4 },
    '脚垫': { '全套': 6, '半套': 3, '四分之一套': 2 }
  };

  const softEmbroideryBySet: Record<string, number> = {
    '全套': 8,
    '半套': 4,
    '四分之一套': 4
  };

  const sewingFee = sewingPrices[productType]?.[setType] || 0;
  let embroideryFee = 0;
  
  if (embroideryType !== '无' && productType === '软包') {
    embroideryFee = softEmbroideryBySet[setType] || 0;
  }

  return { sewingFee, embroideryFee };
};

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // 表单数据
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    customer_name: '',
    customer_phone: '',
    logistics: '',
    brand: '',
    model: '',
    year_style: '',
    product_type: '脚垫',
    version_no: '',
    line_mark: '',
    set_type: '全套',
    embroidery_type: '无',
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

  // 计算工价
  const fees = calculateFees(formData.product_type, formData.set_type, formData.embroidery_type);

  // 获取客户联想
  const fetchCustomerSuggestions = async (keyword: string) => {
    if (keyword.length < 1) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/order?action=customers&keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      setCustomerSuggestions(data.customers || []);
      setShowSuggestions(data.customers.length > 0);
    } catch (error) {
      console.error('获取客户联想失败:', error);
    }
  };

  // 选择客户
  const selectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customer_name: customer.name,
      customer_phone: customer.phone || '',
      logistics: customer.logistics || prev.logistics,
    }));
    setShowSuggestions(false);
  };

  // 提交订单
  const handleSubmit = async () => {
    if (!formData.customer_name) {
      toast.error('请输入客户名称');
      return;
    }
    if (!formData.brand || !formData.model) {
      toast.error('请输入车辆品牌和车型');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(`订单创建成功！订单号: ${data.orderNo}`);
        router.push('/order/list');
      } else {
        toast.error(data.message || '创建失败');
      }
    } catch (error) {
      toast.error('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部标题 */}
      <div className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10 flex items-center justify-between">
        <h1 className="text-lg font-semibold">新建订单</h1>
        <Package className="w-5 h-5" />
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 基本信息 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 下单日期 */}
            <div>
              <Label className="text-sm">下单日期</Label>
              <Input 
                type="date"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* 客户名称 */}
            <div className="relative">
              <Label className="text-sm">客户名称 *</Label>
              <Input 
                value={formData.customer_name}
                onChange={e => {
                  setFormData(prev => ({ ...prev, customer_name: e.target.value }));
                  fetchCustomerSuggestions(e.target.value);
                }}
                onFocus={() => {
                  if (formData.customer_name) fetchCustomerSuggestions(formData.customer_name);
                }}
                placeholder="输入客户名称"
                className="mt-1"
              />
              {/* 联想下拉 */}
              {showSuggestions && customerSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg">
                  {customerSuggestions.map((customer, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectCustomer(customer)}
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-gray-500">
                        {customer.phone} {customer.logistics && `| ${customer.logistics}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 客户电话 */}
            <div>
              <Label className="text-sm">客户电话</Label>
              <Input 
                value={formData.customer_phone}
                onChange={e => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="输入客户电话"
                className="mt-1"
              />
            </div>

            {/* 物流方式 */}
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
            {/* 车辆品牌 */}
            <div>
              <Label className="text-sm">车辆品牌 *</Label>
              <Input 
                value={formData.brand}
                onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="如：宝马、奔驰、奥迪"
                className="mt-1"
              />
            </div>

            {/* 车型 */}
            <div>
              <Label className="text-sm">车型 *</Label>
              <Input 
                value={formData.model}
                onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="如：X5、E300、A6"
                className="mt-1"
              />
            </div>

            {/* 年款 */}
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
            {/* 产品类型 */}
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

            {/* 版型号 */}
            <div>
              <Label className="text-sm">版型号</Label>
              <Input 
                value={formData.version_no}
                onChange={e => setFormData(prev => ({ ...prev, version_no: e.target.value }))}
                placeholder="输入版型号"
                className="mt-1"
              />
            </div>

            {/* 划线 */}
            <div>
              <Label className="text-sm">划线</Label>
              <Input 
                value={formData.line_mark}
                onChange={e => setFormData(prev => ({ ...prev, line_mark: e.target.value }))}
                placeholder="输入划线信息"
                className="mt-1"
              />
            </div>

            {/* 套数类型 */}
            <div>
              <Label className="text-sm">套数类型</Label>
              <Select 
                value={formData.set_type}
                onValueChange={value => setFormData(prev => ({ ...prev, set_type: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {setTypeOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 绣线 */}
            <div>
              <Label className="text-sm">绣线</Label>
              <Select 
                value={formData.embroidery_type}
                onValueChange={value => setFormData(prev => ({ ...prev, embroidery_type: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {embroideryTypeOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 下层材料 */}
            <div>
              <Label className="text-sm">下层材料</Label>
              <Input 
                value={formData.lower_material}
                onChange={e => setFormData(prev => ({ ...prev, lower_material: e.target.value }))}
                placeholder="输入下层材料"
                className="mt-1"
              />
            </div>

            {/* 上层材料 */}
            <div>
              <Label className="text-sm">上层材料</Label>
              <Input 
                value={formData.upper_material}
                onChange={e => setFormData(prev => ({ ...prev, upper_material: e.target.value }))}
                placeholder="输入上层材料"
                className="mt-1"
              />
            </div>

            {/* 工艺 */}
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

            {/* 辅料 */}
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

            {/* 尾垫 */}
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

            {/* 颜色 */}
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
            {/* 数量 */}
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

            {/* 单价 */}
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

            {/* 总价显示 */}
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">总价</span>
                <span className="text-lg font-bold text-blue-600">
                  ¥{(formData.quantity * formData.unit_price).toFixed(2)}
                </span>
              </div>
            </div>

            {/* 工价计算 */}
            <div className="p-3 bg-green-50 rounded-md">
              <div className="text-sm text-gray-600 mb-2">工价计算</div>
              <div className="flex justify-between text-sm mb-1">
                <span>车工费</span>
                <span className="font-medium text-green-600">¥{fees.sewingFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>绣线费</span>
                <span className="font-medium text-green-600">¥{fees.embroideryFee}</span>
              </div>
            </div>

            {/* 付款状态 */}
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
          disabled={loading}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <span>提交中...</span>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              提交订单
            </>
          )}
        </Button>
      </div>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-6 h-12">
          <Link href="/" className="flex flex-col items-center justify-center text-gray-600">
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">首页</span>
          </Link>
          <Link href="/order/new" className="flex flex-col items-center justify-center text-blue-600">
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