'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Search, ChevronRight, Package, FileSearch, Home, Plus, List, Factory, MoreHorizontal } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  order_count: number;
}

export default function CustomerPage() {
  const router = useRouter();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

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
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{customer.name}</div>
                    <div className="text-xs text-gray-500">
                      {customer.phone || '无电话'}
                    </div>
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
          <Link href="/pattern-search" className="flex flex-col items-center justify-center text-gray-600">
            <FileSearch className="w-5 h-5" />
            <span className="text-xs mt-1">版型</span>
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