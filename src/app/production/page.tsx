'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Factory, QrCode, Package, Search, Eye, X, Edit, Trash2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

interface Production {
  id: number;
  production_no: string;
  order_no: string;
  product_info: string;
  quantity: number;
  status: string;
  worker_name: string;
  worker_type: string;
  fee: number;
  complete_time: string;
  customer_name: string;
  version_no: string;
  tail_version_no: string;
  remark: string;
}

interface OrderDetail {
  production_no: string;
  order_no: string;
  product_info: string;
  quantity: number;
  status: string;
  worker_name: string;
  complete_time: string;
  customer_name: string;
  customer_phone: string;
  date: string;
  logistics: string;
  brand: string;
  model: string;
  year_style: string;
  product_type: string;
  version_no: string;
  tail_version_no: string;
  lower_material: string;
  upper_material: string;
  craft: string;
  auxiliary: string;
  tail_mat: string;
  color: string;
  unit_price: number;
  payment_status: string;
  remark: string;
  order_status: string;
}

export default function ProductionPage() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [currentQrCode, setCurrentQrCode] = useState<string>('');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [currentDetail, setCurrentDetail] = useState<OrderDetail | null>(null);
  
  // 编辑和删除状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState<Production | null>(null);
  const [deletingProduction, setDeletingProduction] = useState<Production | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    worker_name: '',
    fee: 0,
    worker_type: '',
    quantity: 1,
    remark: '',
  });
  
  // 筛选条件
  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchProductions();
  }, []);

  const fetchProductions = async (filters?: { orderNo?: string; customer?: string; status?: string }) => {
    setLoading(true);
    try {
      let url = '/api/production';
      const params = new URLSearchParams();
      
      if (filters?.customer) {
        params.append('customer_name', filters.customer);
      }
      if (filters?.status) {
        params.append('status', filters.status);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      // 如果有订单号筛选，在客户端过滤（因为订单号在 production 表）
      let results = data.productions || [];
      const orderNoFilter = filters?.orderNo;
      if (orderNoFilter) {
        results = results.filter((p: Production) => 
          p.order_no.toLowerCase().includes(orderNoFilter.toLowerCase()) ||
          p.production_no.toLowerCase().includes(orderNoFilter.toLowerCase())
        );
      }
      
      setProductions(results);
    } catch (error) {
      console.error('获取生产列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProductions({
      orderNo: searchOrderNo,
      customer: searchCustomer,
      status: filterStatus,
    });
  };

  const handleClearFilters = () => {
    setSearchOrderNo('');
    setSearchCustomer('');
    setFilterStatus('');
    fetchProductions();
  };

  // 打开编辑弹窗（备用）
  const handleEdit = (production: Production) => {
    setEditingProduction(production);
    setEditForm({
      status: production.status || '',
      worker_name: production.worker_name || '',
      fee: production.fee || 0,
      worker_type: production.worker_type || '',
      quantity: production.quantity || 1,
      remark: production.remark || '',
    });
    setEditDialogOpen(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingProduction) return;
    
    try {
      const res = await fetch(`/api/production/${editingProduction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('生产记录已更新');
        setEditDialogOpen(false);
        fetchProductions();
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  // 打开编辑弹窗
  const handleEditClick = (production: Production) => {
    setEditingProduction(production);
    setEditForm({
      status: production.status || '待裁剪',
      worker_name: production.worker_name || '',
      fee: production.fee || 0,
      worker_type: production.worker_type || '车工',
      quantity: production.quantity || 1,
      remark: production.remark || '',
    });
    setEditDialogOpen(true);
  };

  // 打开删除确认弹窗
  const handleDeleteClick = (production: Production) => {
    setDeletingProduction(production);
    setDeleteDialogOpen(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deletingProduction) return;
    
    try {
      const res = await fetch(`/api/production/${deletingProduction.id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('生产记录已删除');
        setDeleteDialogOpen(false);
        fetchProductions();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const generateQrCode = async (productionId: number) => {
    try {
      const res = await fetch(`/api/qrcode?production_id=${productionId}`);
      const data = await res.json();
      
      if (data.success) {
        setCurrentQrCode(data.qrCode);
        setCurrentUrl(data.url);
        setQrDialogOpen(true);
      } else {
        toast.error('生成二维码失败');
      }
    } catch (error) {
      toast.error('生成二维码失败');
    }
  };

  const fetchOrderDetail = async (orderNo: string) => {
    try {
      const res = await fetch(`/api/production?order_no=${orderNo}&detail=true`);
      const data = await res.json();
      
      if (data.production) {
        setCurrentDetail(data.production);
        setDetailDialogOpen(true);
      } else {
        toast.error('获取订单详情失败');
      }
    } catch (error) {
      toast.error('获取订单详情失败');
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case '已付': return 'bg-green-500';
      case '代收': return 'bg-blue-500';
      case '未付': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return '¥0';
    return `¥${price.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部标题 */}
      <div className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-center">生产管理</h1>
      </div>

      {/* 搜索筛选区域 */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="space-y-3">
          {/* 订单号搜索 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs text-gray-500 mb-1">订单号/生产编号</Label>
              <Input
                placeholder="输入订单号或生产编号"
                value={searchOrderNo}
                onChange={(e) => setSearchOrderNo(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          
          {/* 客户名搜索 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs text-gray-500 mb-1">客户名称</Label>
              <Input
                placeholder="输入客户名称"
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          
          {/* 状态筛选 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs text-gray-500 mb-1">状态筛选</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部状态</SelectItem>
                  <SelectItem value="待裁剪">待裁剪</SelectItem>
                  <SelectItem value="待生产">待生产</SelectItem>
                  <SelectItem value="已完成">已完成</SelectItem>
                  <SelectItem value="已发货">已发货</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="flex-1 h-9" size="sm">
              <Search className="w-4 h-4 mr-1" />
              查询
            </Button>
            <Button variant="outline" onClick={handleClearFilters} className="flex-1 h-9" size="sm">
              <X className="w-4 h-4 mr-1" />
              清除
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : productions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Factory className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>暂无生产记录</p>
          </div>
        ) : (
          productions.map(production => (
            <Card key={production.id} className="shadow-sm">
              <CardContent className="p-4">
                {/* 生产编号和订单号 */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-blue-600">{production.production_no}</div>
                    <div className="text-xs text-gray-500">订单: {production.order_no}</div>
                  </div>
                  <Badge className={getStatusColor(production.status)}>
                    {production.status}
                  </Badge>
                </div>

                {/* 产品信息 */}
                <div className="text-sm mb-2">
                  <div className="font-medium">{production.product_info}</div>
                  <div className="text-gray-500">客户: {production.customer_name || '-'}</div>
                  {production.version_no && (
                    <div className="text-gray-500">版型号: <span className="text-blue-600 font-medium">{production.version_no}</span></div>
                  )}
                  {production.tail_version_no && (
                    <div className="text-gray-500">后舱版型号: <span className="text-blue-600 font-medium">{production.tail_version_no}</span></div>
                  )}
                </div>

                {/* 数量和工人 */}
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm text-gray-500">数量: {production.quantity}</div>
                  {production.worker_name && (
                    <div className="text-sm text-gray-500">
                      工人: {production.worker_name}
                      {production.complete_time && (
                        <span className="ml-2">
                          {new Date(production.complete_time).toLocaleString('zh-CN')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchOrderDetail(production.order_no)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    详情
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(production)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateQrCode(production.id)}
                    className="flex-1"
                  >
                    <QrCode className="w-4 h-4 mr-1" />
                    二维码
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(production)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 二维码对话框 */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">生产二维码</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {currentQrCode && (
              <img 
                src={currentQrCode} 
                alt="生产二维码" 
                className="w-64 h-64"
              />
            )}
            <div className="text-xs text-gray-500 text-center break-all">
              扫码打开工人计件页面
            </div>
            <div className="text-xs text-gray-400 text-center break-all">
              {currentUrl}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 订单详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">订单详情</DialogTitle>
          </DialogHeader>
          {currentDetail && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="font-semibold text-sm mb-2 text-blue-600">基本信息</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">订单号:</span>
                    <span className="ml-1 font-medium">{currentDetail.order_no}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">日期:</span>
                    <span className="ml-1">{currentDetail.date || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">客户:</span>
                    <span className="ml-1">{currentDetail.customer_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">电话:</span>
                    <span className="ml-1">{currentDetail.customer_phone || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">物流:</span>
                    <span className="ml-1">{currentDetail.logistics || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 车辆信息 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="font-semibold text-sm mb-2 text-blue-600">车辆信息</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">品牌:</span>
                    <span className="ml-1">{currentDetail.brand || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">车型:</span>
                    <span className="ml-1">{currentDetail.model || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">年款:</span>
                    <span className="ml-1">{currentDetail.year_style || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">软包/脚垫版型号:</span>
                    <span className="ml-1 font-medium text-blue-600">{currentDetail.version_no || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">尾垫版型号:</span>
                    <span className="ml-1 font-medium text-blue-600">{currentDetail.tail_version_no || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 产品信息 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="font-semibold text-sm mb-2 text-blue-600">产品信息</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">产品类型:</span>
                    <span className="ml-1">{currentDetail.product_type || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">颜色:</span>
                    <span className="ml-1">{currentDetail.color || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">下层材料:</span>
                    <span className="ml-1">{currentDetail.lower_material || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">上层材料:</span>
                    <span className="ml-1">{currentDetail.upper_material || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">工艺:</span>
                    <span className="ml-1">{currentDetail.craft || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">辅料:</span>
                    <span className="ml-1">{currentDetail.auxiliary || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">尾垫:</span>
                    <span className="ml-1">{currentDetail.tail_mat || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">数量:</span>
                    <span className="ml-1">{currentDetail.quantity || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 价格与状态 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="font-semibold text-sm mb-2 text-blue-600">价格与状态</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">单价:</span>
                    <span className="ml-1 font-semibold text-blue-600">{formatPrice(currentDetail.unit_price)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">总价:</span>
                    <span className="ml-1 font-semibold text-blue-600">
                      {formatPrice((currentDetail.unit_price || 0) * (currentDetail.quantity || 1))}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500">付款状态:</span>
                    <Badge className={`ml-1 ${getPaymentStatusColor(currentDetail.payment_status)}`}>
                      {currentDetail.payment_status || '-'}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500">订单状态:</span>
                    <Badge className={`ml-1 ${getStatusColor(currentDetail.order_status)}`}>
                      {currentDetail.order_status || '-'}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500">生产状态:</span>
                    <Badge className={`ml-1 ${getStatusColor(currentDetail.status)}`}>
                      {currentDetail.status || '-'}
                    </Badge>
                  </div>
                  {currentDetail.worker_name && (
                    <div>
                      <span className="text-gray-500">工人:</span>
                      <span className="ml-1">{currentDetail.worker_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 备注 */}
              {currentDetail.remark && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="font-semibold text-sm mb-2 text-blue-600">备注</h3>
                  <div className="text-sm text-gray-700">{currentDetail.remark}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑生产记录弹窗 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>编辑生产记录</DialogTitle>
          </DialogHeader>
          {editingProduction && (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">生产编号</label>
                <div className="text-sm font-medium">{editingProduction.production_no}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">状态</label>
                <select
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                >
                  <option value="待裁剪">待裁剪</option>
                  <option value="待生产">待生产</option>
                  <option value="生产中">生产中</option>
                  <option value="已完成">已完成</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-500">车工姓名</label>
                <input
                  type="text"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={editForm.worker_name}
                  onChange={(e) => setEditForm({...editForm, worker_name: e.target.value})}
                  placeholder="输入车工姓名"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">费用(元)</label>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={editForm.fee}
                  onChange={(e) => setEditForm({...editForm, fee: Number(e.target.value)})}
                  placeholder="输入费用"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)}>
                  取消
                </Button>
                <Button className="flex-1 bg-blue-500" onClick={handleSaveEdit}>
                  保存
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">确定要删除这条生产记录吗？</p>
            {deletingProduction && (
              <p className="text-sm font-medium mt-2">{deletingProduction.production_no}</p>
            )}
            <p className="text-xs text-red-500 mt-2">删除后无法恢复</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleConfirmDelete}>
              删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 底部导航 */}
      <BottomNav current="production" />
    </div>
  );
}