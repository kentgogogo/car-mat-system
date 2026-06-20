'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Factory, QrCode, Package, FileSearch, Home, Plus, List, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

interface Production {
  id: number;
  production_no: string;
  order_no: string;
  product_info: string;
  quantity: number;
  status: string;
  worker_name: string;
  complete_time: string;
  customer_name: string;
}

export default function ProductionPage() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [currentQrCode, setCurrentQrCode] = useState<string>('');
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    fetchProductions();
  }, []);

  const fetchProductions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/production');
      const data = await res.json();
      setProductions(data.productions || []);
    } catch (error) {
      console.error('获取生产列表失败:', error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case '待生产': return 'bg-blue-500';
      case '已完成': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部标题 */}
      <div className="bg-blue-600 text-white px-4 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-center">生产管理</h1>
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

                {/* 二维码按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateQrCode(production.id)}
                  className="w-full"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  生成二维码
                </Button>
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
          <Link href="/production" className="flex flex-col items-center justify-center text-blue-600">
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