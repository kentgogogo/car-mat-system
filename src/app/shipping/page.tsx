'use client';

import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Truck, Plus, Edit2, Trash2, X, Check, RefreshCw,
  User, Car, Ship, CreditCard, Layers, FileText, ClipboardList
} from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface ShippingRecord {
  id: string;
  source: 'order' | 'manual';
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
  const [shippingList, setShippingList] = useState<ShippingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 新增发货表单状态
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newRecord, setNewRecord] = useState({
    customer_name: '',
    vehicle: '',
    logistics: '',
    tracking_no: '',
    is_collect: '否',
    lower_material: '',
    upper_material: '',
    tail_mat: '',
    remark: ''
  });
  
  // 添加订单表单状态
  const [showAddOrderForm, setShowAddOrderForm] = useState(false);
  const [addingOrder, setAddingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_name: '',
    vehicle: '',
    logistics: '',
    is_collect: '否',
    lower_material: '',
    upper_material: '',
    tail_mat: '',
    remark: ''
  });
  
  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRecord, setEditRecord] = useState<ShippingRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchShippingList = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await fetch('/api/shipping');
      const data = await res.json();
      setShippingList(data.shippingList || []);
    } catch (error) {
      console.error('获取发货列表失败:', error);
    } finally {
      if (showLoading) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShippingList(true);
    
    // 30秒轮询刷新
    const interval = setInterval(() => fetchShippingList(false), 30000);
    return () => clearInterval(interval);
  }, []);

  // 新增发货记录
  const handleAdd = async () => {
    if (!newRecord.customer_name.trim()) {
      alert('请输入客户名称');
      return;
    }
    
    setAdding(true);
    try {
      const res = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      
      const data = await res.json();
      if (data.success) {
        setShowAddForm(false);
        setNewRecord({
          customer_name: '',
          vehicle: '',
          logistics: '',
          tracking_no: '',
          is_collect: '否',
          lower_material: '',
          upper_material: '',
          tail_mat: '',
          remark: ''
        });
        fetchShippingList(false);
      } else {
        alert(data.error || '添加失败');
      }
    } catch (error) {
      console.error('添加发货记录失败:', error);
      alert('添加失败');
    } finally {
      setAdding(false);
    }
  };

  // 添加订单（直接保存为已发货）
  const handleAddOrder = async () => {
    if (!newOrder.customer_name.trim()) {
      alert('请输入客户名称');
      return;
    }
    
    setAddingOrder(true);
    try {
      const res = await fetch('/api/shipping/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      
      const data = await res.json();
      if (data.success) {
        setShowAddOrderForm(false);
        setNewOrder({
          customer_name: '',
          vehicle: '',
          logistics: '',
          is_collect: '否',
          lower_material: '',
          upper_material: '',
          tail_mat: '',
          remark: ''
        });
        fetchShippingList(false);
      } else {
        alert(data.error || '添加失败');
      }
    } catch (error) {
      console.error('添加订单失败:', error);
      alert('添加失败');
    } finally {
      setAddingOrder(false);
    }
  };

  // 开始编辑
  const startEdit = (record: ShippingRecord) => {
    setEditingId(record.id);
    setEditRecord({ ...record });
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditRecord(null);
  };

  // 保存编辑
  const saveEdit = async () => {
    if (!editRecord) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/shipping/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: editRecord.customer_name,
          vehicle: editRecord.vehicle,
          logistics: editRecord.logistics,
          tracking_no: editRecord.tracking_no,
          is_collect: editRecord.is_collect,
          lower_material: editRecord.lower_material,
          upper_material: editRecord.upper_material,
          tail_mat: editRecord.tail_mat,
          remark: editRecord.remark
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        setEditRecord(null);
        fetchShippingList(false);
      } else {
        alert(data.error || '更新失败');
      }
    } catch (error) {
      console.error('更新发货信息失败:', error);
      alert('更新失败');
    } finally {
      setSaving(false);
    }
  };

  // 删除记录
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条发货记录吗？')) return;
    
    try {
      const res = await fetch(`/api/shipping/${id}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      if (data.success) {
        fetchShippingList(false);
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除发货记录失败:', error);
      alert('删除失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 顶部标题 */}
      <div className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10 flex items-center justify-between">
        <h1 className="text-lg font-semibold">发货管理</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchShippingList(false)}
            disabled={refreshing}
            className="text-white hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddOrderForm(true)}
            className="text-white hover:bg-blue-700"
          >
            <ClipboardList className="w-4 h-4 mr-1" />
            添加订单
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            新增发货
          </Button>
        </div>
      </div>

      {/* 新增发货表单 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-lg p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">新增发货记录</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">客户名称 *</label>
                <Input
                  value={newRecord.customer_name}
                  onChange={e => setNewRecord(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="输入客户名称"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">车型</label>
                <Input
                  value={newRecord.vehicle}
                  onChange={e => setNewRecord(prev => ({ ...prev, vehicle: e.target.value }))}
                  placeholder="如：奥迪A6L 2024款"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">物流公司</label>
                  <Input
                    value={newRecord.logistics}
                    onChange={e => setNewRecord(prev => ({ ...prev, logistics: e.target.value }))}
                    placeholder="如：顺丰"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">物流单号</label>
                  <Input
                    value={newRecord.tracking_no}
                    onChange={e => setNewRecord(prev => ({ ...prev, tracking_no: e.target.value }))}
                    placeholder="快递单号"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">是否代收</label>
                <div className="flex gap-2">
                  <Button
                    variant={newRecord.is_collect === '是' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewRecord(prev => ({ ...prev, is_collect: '是' }))}
                    className={newRecord.is_collect === '是' ? 'bg-blue-600' : ''}
                  >
                    是
                  </Button>
                  <Button
                    variant={newRecord.is_collect === '否' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewRecord(prev => ({ ...prev, is_collect: '否' }))}
                    className={newRecord.is_collect === '否' ? 'bg-blue-600' : ''}
                  >
                    否
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">下层材料</label>
                  <Input
                    value={newRecord.lower_material}
                    onChange={e => setNewRecord(prev => ({ ...prev, lower_material: e.target.value }))}
                    placeholder="下层材料"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">上层材料</label>
                  <Input
                    value={newRecord.upper_material}
                    onChange={e => setNewRecord(prev => ({ ...prev, upper_material: e.target.value }))}
                    placeholder="上层材料"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">尾垫</label>
                <Input
                  value={newRecord.tail_mat}
                  onChange={e => setNewRecord(prev => ({ ...prev, tail_mat: e.target.value }))}
                  placeholder="尾垫信息（如有）"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">备注</label>
                <Input
                  value={newRecord.remark}
                  onChange={e => setNewRecord(prev => ({ ...prev, remark: e.target.value }))}
                  placeholder="备注信息"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddForm(false)}>
                取消
              </Button>
              <Button className="flex-1 bg-blue-600" onClick={handleAdd} disabled={adding}>
                {adding ? '添加中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 添加订单表单 */}
      {showAddOrderForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-lg p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">添加订单</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddOrderForm(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">客户名称 *</label>
                <Input
                  value={newOrder.customer_name}
                  onChange={e => setNewOrder(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="输入客户名称"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">车型</label>
                <Input
                  value={newOrder.vehicle}
                  onChange={e => setNewOrder(prev => ({ ...prev, vehicle: e.target.value }))}
                  placeholder="如：奥迪A6L 2024款"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">物流</label>
                <Input
                  value={newOrder.logistics}
                  onChange={e => setNewOrder(prev => ({ ...prev, logistics: e.target.value }))}
                  placeholder="物流公司"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">是否代收</label>
                <div className="flex gap-2">
                  <Button
                    variant={newOrder.is_collect === '是' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewOrder(prev => ({ ...prev, is_collect: '是' }))}
                    className={newOrder.is_collect === '是' ? 'bg-blue-600' : ''}
                  >
                    是
                  </Button>
                  <Button
                    variant={newOrder.is_collect === '否' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewOrder(prev => ({ ...prev, is_collect: '否' }))}
                    className={newOrder.is_collect === '否' ? 'bg-blue-600' : ''}
                  >
                    否
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">下层材料</label>
                  <Input
                    value={newOrder.lower_material}
                    onChange={e => setNewOrder(prev => ({ ...prev, lower_material: e.target.value }))}
                    placeholder="下层材料"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">上层材料</label>
                  <Input
                    value={newOrder.upper_material}
                    onChange={e => setNewOrder(prev => ({ ...prev, upper_material: e.target.value }))}
                    placeholder="上层材料"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">尾垫</label>
                <Input
                  value={newOrder.tail_mat}
                  onChange={e => setNewOrder(prev => ({ ...prev, tail_mat: e.target.value }))}
                  placeholder="尾垫信息（如有）"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">备注</label>
                <Input
                  value={newOrder.remark}
                  onChange={e => setNewOrder(prev => ({ ...prev, remark: e.target.value }))}
                  placeholder="备注信息"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddOrderForm(false)}>
                取消
              </Button>
              <Button className="flex-1 bg-blue-600" onClick={handleAddOrder} disabled={addingOrder}>
                {addingOrder ? '添加中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑发货表单 */}
      {editingId && editRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-lg p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">编辑发货信息</h2>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">客户名称</label>
                <Input
                  value={editRecord.customer_name}
                  onChange={e => setEditRecord(prev => prev ? { ...prev, customer_name: e.target.value } : null)}
                  disabled={editRecord.source === 'order'}
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">车型</label>
                <Input
                  value={editRecord.vehicle}
                  onChange={e => setEditRecord(prev => prev ? { ...prev, vehicle: e.target.value } : null)}
                  disabled={editRecord.source === 'order'}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">物流公司</label>
                  <Input
                    value={editRecord.logistics}
                    onChange={e => setEditRecord(prev => prev ? { ...prev, logistics: e.target.value } : null)}
                    placeholder="物流公司"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">物流单号</label>
                  <Input
                    value={editRecord.tracking_no}
                    onChange={e => setEditRecord(prev => prev ? { ...prev, tracking_no: e.target.value } : null)}
                    placeholder="快递单号"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">是否代收</label>
                <div className="flex gap-2">
                  <Button
                    variant={editRecord.is_collect === '是' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditRecord(prev => prev ? { ...prev, is_collect: '是' } : null)}
                    disabled={editRecord.source === 'order'}
                    className={editRecord.is_collect === '是' ? 'bg-blue-600' : ''}
                  >
                    是
                  </Button>
                  <Button
                    variant={editRecord.is_collect === '否' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditRecord(prev => prev ? { ...prev, is_collect: '否' } : null)}
                    disabled={editRecord.source === 'order'}
                    className={editRecord.is_collect === '否' ? 'bg-blue-600' : ''}
                  >
                    否
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">下层材料</label>
                  <Input
                    value={editRecord.lower_material}
                    onChange={e => setEditRecord(prev => prev ? { ...prev, lower_material: e.target.value } : null)}
                    disabled={editRecord.source === 'order'}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">上层材料</label>
                  <Input
                    value={editRecord.upper_material}
                    onChange={e => setEditRecord(prev => prev ? { ...prev, upper_material: e.target.value } : null)}
                    disabled={editRecord.source === 'order'}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">尾垫</label>
                <Input
                  value={editRecord.tail_mat}
                  onChange={e => setEditRecord(prev => prev ? { ...prev, tail_mat: e.target.value } : null)}
                  disabled={editRecord.source === 'order'}
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-500 mb-1 block">备注</label>
                <Input
                  value={editRecord.remark}
                  onChange={e => setEditRecord(prev => prev ? { ...prev, remark: e.target.value } : null)}
                  placeholder="备注信息"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={cancelEdit}>
                取消
              </Button>
              <Button className="flex-1 bg-blue-600" onClick={saveEdit} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 发货列表 */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : shippingList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>暂无发货记录</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              新增发货记录
            </Button>
          </div>
        ) : (
          shippingList.map(record => (
            <Card key={record.id} className="shadow-sm">
              <CardContent className="p-4">
                {/* 来源标识和操作按钮 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={record.source === 'order' ? 'default' : 'secondary'}>
                      {record.source === 'order' ? '来自订单' : '手动录入'}
                    </Badge>
                    {record.order_no && (
                      <span className="text-xs text-gray-500">{record.order_no}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(record)}>
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </Button>
                    {record.source === 'manual' && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* 日期 */}
                <div className="text-xs text-gray-500 mb-2">{record.date}</div>

                {/* 客户名称 */}
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{record.customer_name}</span>
                </div>

                {/* 车型 */}
                {record.vehicle && (
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{record.vehicle}</span>
                  </div>
                )}

                {/* 物流信息 */}
                <div className="flex items-center gap-2 mb-2">
                  <Ship className="w-4 h-4 text-gray-500" />
                  <div className="flex gap-1">
                    {record.logistics && (
                      <Badge variant="outline">{record.logistics}</Badge>
                    )}
                    {record.tracking_no && (
                      <Badge className="bg-blue-100 text-blue-700">{record.tracking_no}</Badge>
                    )}
                    {!record.logistics && !record.tracking_no && (
                      <span className="text-sm text-gray-400">暂无物流信息</span>
                    )}
                  </div>
                </div>

                {/* 是否代收 */}
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <Badge variant={record.is_collect === '是' ? 'default' : 'outline'} 
                    className={record.is_collect === '是' ? 'bg-yellow-100 text-yellow-700' : ''}>
                    {record.is_collect === '是' ? '代收' : '不代收'}
                  </Badge>
                </div>

                {/* 材料信息 */}
                {(record.lower_material || record.upper_material) && (
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-gray-500" />
                    <div className="text-sm text-gray-600">
                      {record.lower_material && <span>下层：{record.lower_material}</span>}
                      {record.lower_material && record.upper_material && <span className="mx-1">/</span>}
                      {record.upper_material && <span>上层：{record.upper_material}</span>}
                    </div>
                  </div>
                )}

                {/* 尾垫 */}
                {record.tail_mat && (
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">尾垫：{record.tail_mat}</span>
                  </div>
                )}

                {/* 备注 */}
                {record.remark && (
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">备注：{record.remark}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 底部导航 */}
      <BottomNav current="shipping" />
    </div>
  );
}

export default function ShippingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    }>
      <ShippingContent />
    </Suspense>
  );
}