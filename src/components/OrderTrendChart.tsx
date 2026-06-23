'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendData {
  date: string;
  count: number;
}

export default function OrderTrendChart() {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendData();
  }, []);

  const fetchTrendData = async () => {
    try {
      // 获取最近7天的订单趋势
      const res = await fetch('/api/orders/trend');
      const json = await res.json();
      setData(json.trend || []);
    } catch (e) {
      console.error('获取趋势数据失败', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-32 flex items-center justify-center text-gray-400">加载中...</div>;
  }

  if (!data.length) {
    return <div className="h-32 flex items-center justify-center text-gray-400">暂无数据</div>;
  }

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
          <Tooltip 
            contentStyle={{ fontSize: 12, padding: '4px 8px' }}
            formatter={(value: number) => [`${value}单`, '订单数']}
          />
          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}