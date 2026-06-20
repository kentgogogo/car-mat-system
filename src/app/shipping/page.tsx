'use client';

import { useState, useEffect, Suspense } from 'react';
import { Package, Truck, User, Car, Edit, Save, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

interface ShippingItem {
  id: number;
  order_no: string;
  date: string;
  customer_name: string;
  customer_phone: string;
  logistics: string;
  tracking_no: string;
  is_collect: string;
  vehicle: string;
  lower_material: string;
  upper_material: string;
  tail_mat: string;
  quantity: number;
  remark: string;
}

function ShippingContent() {
  const [shippingList, setShippingList] = useState<ShippingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ShippingItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    logistics: '',
    tracking_no: '',
    remark: ''
  });

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

  const handleEdit = (item: ShippingItem) => {
    setEditingItem(item);
    setEditForm({
      logistics: item.logistics || '',
      tracking_no: item.tracking_no || '',
      remark: item.remark || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    try {
      const res = await fetch(`/api/shipping/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('发货信息已更新');
        setEditDialogOpen(false);
        fetchShippingList();
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
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
            <p className="text-sm mt-2">在订单列表勾选订单后点击"发送到发货"</p>
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
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-500">{item.date}</div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 px-2"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </div>
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
                    <div className="flex items-center gap-3 flex-wrap">
                      {item.logistics && (
                        <Badge variant="outline" className="text-xs">
                          <Truck className="w-3 h-3 mr-1" />
                          {item.logistics}
                        </Badge>
                      )}
                      {item.tracking_no && (
                        <Badge variant="outline" className="text-xs text-blue-600">
                          单号: {item.tracking_no}
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

      {/* 编辑发货信息对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>编辑发货信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-gray-500 mb-2">
              订单号：{editingItem?.order_no}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logistics">物流公司</Label>
              <Input
                id="logistics"
                value={editForm.logistics}
                onChange={(e) => setEditForm({...editForm, logistics: e.target.value})}
                placeholder="如：顺丰、德邦、中通..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tracking_no">物流单号</Label>
              <Input
                id="tracking_no"
                value={editForm.tracking_no}
                onChange={(e) => setEditForm({...editForm, tracking_no: e.target.value})}
                placeholder="输入物流单号"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remark">备注</Label>
              <Input
                id="remark"
                value={editForm.remark}
                onChange={(e) => setEditForm({...editForm, remark: e.target.value})}
                placeholder="发货备注信息"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="w-4 h-4 mr-1" />
              取消
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="w-4 h-4 mr-1" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 底部导航 */}
      <BottomNav current="shipping" />
    </div>
  );
}

export default function ShippingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">加载中...</div>}>
      <ShippingContent />
    </Suspense>
  );
}