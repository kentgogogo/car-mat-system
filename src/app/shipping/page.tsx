'use client';

import { useEffect, useState, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Truck, Plus, Edit2, Trash2, X, RefreshCw,
  User, Car, Ship, CreditCard, Layers, FileText
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
  amount: number;
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
    amount: 0,
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

  // 新增发货记录（同时创建订单）
  const handleAdd = async () => {
    if (!newRecord.customer_name.trim()) {
      alert('请输入客户名称');
      return;
    }
    
    setAdding(true);
    try {
      // 调用新增发货API（会同时创建订单）
      const res = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRecord,
          create_order: true  // 标记需要同时创建订单
        })
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
          amount: 0,
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-sm mx-4 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">新增发货</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="h-7 w-7 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <label className="text-xs text-gray-500">客户名称 *</label>
                <Input
                  value={newRecord.customer_name}
                  onChange={e => setNewRecord(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="客户名称"
                  className="h-8 mt-1"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-500">车型</label>
                <Input
                  value={newRecord.vehicle}
                  onChange={e => setNewRecord(prev => ({ ...prev, vehicle: e.target.value }))}
                  placeholder="车型"
                  className="h-8 mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">物流公司</label>
                  <Input
                    value={newRecord.logistics}
                    onChange={e => setNewRecord(prev => ({ ...prev, logistics: e.target.value }))}
                    placeholder="物流"
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">物流单号</label>
                  <Input
                    value={newRecord.tracking_no}
                    onChange={e => setNewRecord(prev => ({ ...prev, tracking_no: e.target.value }))}
                    placeholder="单号"
                    className="h-8 mt-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500">是否代收</label>
                <div className="flex gap-1 mt-1">
                  <Button
                    variant={newRecord.is_collect === '是' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewRecord(prev => ({ ...prev, is_collect: '是' }))}
                    className={`h-7 px-3 ${newRecord.is_collect === '是' ? 'bg-blue-600' : ''}`}
                  >
                    是
                  </Button>
                  <Button
                    variant={newRecord.is_collect === '否' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewRecord(prev => ({ ...prev, is_collect: '否' }))}
                    className={`h-7 px-3 ${newRecord.is_collect === '否' ? 'bg-blue-600' : ''}`}
                  >
                    否
                  </Button>
                </div>
              </div>
              
              {newRecord.is_collect === '是' && (
                <div>
                  <label className="text-xs text-gray-500">代收金额</label>
                  <Input
                    type="number"
                    value={newRecord.amount}
                    onChange={e => setNewRecord(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="金额"
                    className="h-8 mt-1"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">下层材料</label>
                  <Input
                    value={newRecord.lower_material}
                    onChange={e => setNewRecord(prev => ({ ...prev, lower_material: e.target.value }))}
                    placeholder="下层"
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">上层材料</label>
                  <Input
                    value={newRecord.upper_material}
                    onChange={e => setNewRecord(prev => ({ ...prev, upper_material: e.target.value }))}
                    placeholder="上层"
                    className="h-8 mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">尾垫</label>
                  <Input
                    value={newRecord.tail_mat}
                    onChange={e => setNewRecord(prev => ({ ...prev, tail_mat: e.target.value }))}
                    placeholder="尾垫"
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">备注</label>
                  <Input
                    value={newRecord.remark}
                    onChange={e => setNewRecord(prev => ({ ...prev, remark: e.target.value }))}
                    placeholder="备注"
                    className="h-8 mt-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => setShowAddForm(false)}>
                取消
              </Button>
              <Button size="sm" className="flex-1 h-8 bg-blue-600" onClick={handleAdd} disabled={adding}>
                {adding ? '添加中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑发货表单 */}
      {editingId && editRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-sm mx-4 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">编辑发货</h2>
              <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-7 w-7 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <label className="text-xs text-gray-500">客户名称</label>
                <Input
                  value={editRecord.customer_name}
                  onChange={e => setEditRecord(prev => prev ? { ...prev, customer_name: e.target.value } : null)}
                  disabled={editRecord.source === 'order'}
                  className="h-8 mt-1"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-500">车型</label>
                <Input
                  value={editRecord.vehicle}
                  onChange={e => setEditRecord(prev => prev ? { ...prev, vehicle: e.target.value } : null)}
                  disabled={editRecord.source === 'order'}
                  className="h-8 mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">物流公司</label>
                  <Input
                    value={editRecord.logistics}
                    onChange={e => setEditRecord(prev => prev ? { ...prev, logistics: e.target.value } : null)}
                    placeholder="物流"
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">物流单号</label>
                  <Input
                    value={editRecord.tracking_no}
                    onChange={e => setEditRecord(prev => prev ? { ...prev, tracking_no: e.target.value } : null)}
                    placeholder="单号"
                    className="h-8 mt-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500">是否代收</label>
                <div className="flex gap-1 mt-1">
                  <Button
                    variant={editRecord.is_collect === '是' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditRecord(prev => prev ? { ...prev, is_collect: '是' } : null)}
                    disabled={editRecord.source === 'order'}
                    className={`h-7 px-3 ${editRecord.is_collect === '是' ? 'bg-blue-600' : ''}`}
                  >
                    是
                  </Button>
                  <Button
                    variant={editRecord.is_collect === '否' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditRecord(prev => prev ? { ...prev, is_collect: '否' } : null)}
                    disabled={editRecord.source === 'order'}
                    className={`h-7 px-3 ${editRecord.is_collect === '否' ? 'bg-blue-600' : ''}`}
                  >
                    否
                  </Button>
                </div>
              </div>
              
              {editRecord.is_collect === '是' && (
                <div>
                  <label className="text-xs text-gray-500">代收金额</label>
                  <Input
                    type="number"
                    value={editRecord.amount}
                    onChange={e => setEditRecord(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                    placeholder="金额"
                    className="h-8 mt-1"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">下层材料</label>
                  <Input
                    value={editRecord.lower_material}
                    onChange={e => setEditRecord(prev => prev ? { ...prev, lower_material: e.target.value } : null)}
                    disabled={editRecord.source === 'order'}
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">上层材料</label>
                  <Input
                    value={editRecord.upper_material}
                    onChange={e => setEditRecord(prev => prev ? { ...prev, upper_material: e.target.value } : null)}
                    disabled={editRecord.source === 'order'}
                    className="h-8 mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">尾垫</label>
                  <Input
                    value={editRecord.tail_mat}
                    onChange={e => setEditRecord(prev => prev ? { ...prev, tail_mat: e.target.value } : null)}
                    disabled={editRecord.source === 'order'}
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">备注</label>
                  <Input
                    value={editRecord.remark}
                    onChange={e => setEditRecord(prev => prev ? { ...prev, remark: e.target.value } : null)}
                    placeholder="备注"
                    className="h-8 mt-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 h-8" onClick={cancelEdit}>
                取消
              </Button>
              <Button size="sm" className="flex-1 h-8 bg-blue-600" onClick={saveEdit} disabled={saving}>
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
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(record)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    {record.source === 'manual' && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(record.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* 基本信息 */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{record.customer_name}</span>
                    {record.customer_phone && (
                      <span className="text-gray-500">{record.customer_phone}</span>
                    )}
                  </div>
                  
                  {record.vehicle && (
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-gray-400" />
                      <span>{record.vehicle}</span>
                    </div>
                  )}
                  
                  {/* 物流信息 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {record.logistics && (
                      <div className="flex items-center gap-1">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <Badge variant="outline" className="text-xs">{record.logistics}</Badge>
                      </div>
                    )}
                    {record.tracking_no && (
                      <Badge className="text-xs bg-blue-100 text-blue-700">{record.tracking_no}</Badge>
                    )}
                  </div>
                  
                  {/* 代收标识 */}
                  {record.is_collect === '是' && (
                    <Badge className="bg-orange-100 text-orange-700 text-xs">
                      <CreditCard className="w-3 h-3 mr-1" />
                      代收
                    </Badge>
                  )}
                  
                  {/* 材料信息 */}
                  {(record.lower_material || record.upper_material) && (
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {record.lower_material && `下层: ${record.lower_material}`}
                        {record.lower_material && record.upper_material && ' / '}
                        {record.upper_material && `上层: ${record.upper_material}`}
                      </span>
                    </div>
                  )}
                  
                  {/* 尾垫 */}
                  {record.tail_mat && (
                    <div className="text-gray-600 text-xs">
                      尾垫: {record.tail_mat}
                    </div>
                  )}
                  
                  {/* 备注 */}
                  {record.remark && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{record.remark}</span>
                    </div>
                  )}
                  
                  {/* 日期 */}
                  <div className="text-xs text-gray-400 mt-2">
                    {record.date}
                  </div>
                </div>
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
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">加载中...</div>}>
      <ShippingContent />
    </Suspense>
  );
}