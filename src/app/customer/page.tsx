'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, Search, ChevronRight, Package, ClipboardList, Home, Plus, List, Factory, MoreHorizontal, Upload, X, Truck, DollarSign, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
  id: number;
  name: string;
  phone: string;
  logistics: string;
  is_collect: string;
  remark: string;
  order_count: number;
}

function CustomerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  
  // 批量导入相关状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer?keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('获取客户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCustomers();
  };

  // 解析导入文本（支持多字段）
  const parseImportText = (text: string) => {
    const lines = text.trim().split('\n');
    const customers: Array<{ name: string; phone?: string; logistics?: string; is_collect?: string; remark?: string }> = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // 支持格式：
      // 1. 姓名,电话,物流,代收,备注（逗号分隔）
      // 2. 姓名 电话 物流 代收 备注（空格分隔）
      // 3. 仅姓名
      const parts = trimmedLine.split(/[,\s]+/);
      if (parts.length >= 1) {
        const name = parts[0].trim();
        const phone = parts.length >= 2 ? parts[1].trim() : undefined;
        const logistics = parts.length >= 3 ? parts[2].trim() : undefined;
        const is_collect = parts.length >= 4 ? parts[3].trim() : undefined;
        const remark = parts.length >= 5 ? parts[4].trim() : undefined;
        
        if (name) {
          customers.push({ name, phone, logistics, is_collect, remark });
        }
      }
    }
    
    return customers;
  };

  // 执行批量导入
  const handleImport = async () => {
    const customersToImport = parseImportText(importText);
    
    if (customersToImport.length === 0) {
      toast.error('请输入有效的客户数据');
      return;
    }
    
    setImporting(true);
    try {
      const res = await fetch('/api/customer/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: customersToImport }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        setShowImportModal(false);
        setImportText('');
        fetchCustomers(); // 刷新列表
      } else {
        toast.error(data.error || '导入失败');
      }
    } catch (error) {
      toast.error('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部标题 */}
      <div className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-center">客户管理</h1>
      </div>

      {/* 搜索区域 */}
      <div className="px-4 py-3 bg-white border-b sticky top-12 z-10">
        <div className="flex gap-2">
          <Input
            placeholder="搜索客户名称"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="h-9"
          />
          <Button
            onClick={handleSearch}
            size="sm"
            className="h-9"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setShowImportModal(true)}
            size="sm"
            variant="outline"
            className="h-9"
          >
            <Upload className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>暂无客户</p>
          </div>
        ) : (
          customers.map(customer => (
            <Card 
              key={customer.id}
              className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/customer/detail?id=${customer.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold">{customer.name}</div>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                      {customer.phone && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded">{customer.phone}</span>
                      )}
                      {customer.logistics && (
                        <span className="bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {customer.logistics}
                        </span>
                      )}
                      {customer.is_collect === '是' && (
                        <span className="bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          代收
                        </span>
                      )}
                    </div>
                    {customer.remark && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {customer.remark}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      订单数: {customer.order_count}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 批量导入模态框 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-auto">
            {/* 模态框标题 */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="font-semibold">批量导入客户</h2>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 模态框内容 */}
            <div className="px-4 py-4 space-y-4">
              <div>
                <Label className="text-sm">客户数据</Label>
                <Textarea 
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="每行一个客户，格式：姓名,电话,物流,代收,备注"
                  className="mt-2 min-h-[150px]"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-2">
                  示例格式：<br />
                  张三,13800138000,文达,是,备注信息<br />
                  李四 13900139000 顺丰 否<br />
                  王五（仅姓名）
                </p>
              </div>
              
              {/* 解析预览 */}
              {importText.trim() && (
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm text-gray-500 mb-2">识别到 {parseImportText(importText).length} 个客户</p>
                  <div className="text-xs text-gray-600 space-y-1 max-h-[100px] overflow-auto">
                    {parseImportText(importText).slice(0, 10).map((c, i) => (
                      <div key={i}>
                        {c.name} 
                        {c.phone && ` (${c.phone})`}
                        {c.logistics && ` [${c.logistics}]`}
                        {c.is_collect === '是' && ' [代收]'}
                      </div>
                    ))}
                    {parseImportText(importText).length > 10 && (
                      <div className="text-gray-400">...还有 {parseImportText(importText).length - 10} 个</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 提交按钮 */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowImportModal(false)}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={importing || !importText.trim()}
                  className="flex-1"
                >
                  {importing ? '导入中...' : '确认导入'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default function CustomerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    }>
      <CustomerPageContent />
    </Suspense>
  );
}