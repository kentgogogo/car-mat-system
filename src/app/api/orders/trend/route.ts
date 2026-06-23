import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// 获取订单趋势（最近7天）
export async function GET() {
  try {
    const db = await getDb();
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
  } catch (e) {
    console.error('获取订单趋势失败', e);
    return NextResponse.json({ trend: [] });
  }
}