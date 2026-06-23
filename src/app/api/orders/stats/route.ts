import { NextRequest, NextResponse } from 'next/server';
import { getDb, safeSave } from '@/lib/db';

// 获取销售统计和订单趋势
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const type = searchParams.get('type'); // 'stats' or 'trend'

  try {
    const db = await getDb();

    // 销售总额统计
    if (start && end) {
      const stmt = db.prepare(`
        SELECT SUM(total_price) as total_sales, COUNT(*) as order_count
        FROM orders
        WHERE date >= ? AND date <= ?
      `);
      stmt.bind([`${start} 00:00:00`, `${end} 23:59:59`]);
      const result = stmt.step() ? (stmt as any).getAsObject() : { total_sales: 0, order_count: 0 };
      stmt.free();

      return NextResponse.json({
        totalSales: result.total_sales || 0,
        orderCount: result.order_count || 0
      });
    }

    // 订单趋势（最近7天）
    if (type === 'trend') {
      const trendData = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const stmt = db.prepare(`
          SELECT COUNT(*) as count
          FROM orders
          WHERE date >= ? AND date <= ?
        `);
        stmt.bind([`${dateStr} 00:00:00`, `${dateStr} 23:59:59`]);
        const result = stmt.step() ? (stmt as any).getAsObject() : { count: 0 };
        stmt.free();

        trendData.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          count: result.count || 0
        });
      }

      return NextResponse.json({ trend: trendData });
    }

    return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  } catch (e) {
    console.error('订单统计错误', e);
    return NextResponse.json({ error: '统计失败' }, { status: 500 });
  }
}