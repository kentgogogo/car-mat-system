import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);

    // 今日订单数
    const todayOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE date = ?
    `).get(today) as { count: number };

    // 今日销售额
    const todaySales = db.prepare(`
      SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE date = ?
    `).get(today) as { total: number };

    // 本月订单数
    const monthOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE date LIKE ?
    `).get(`${currentMonth}%`) as { count: number };

    // 本月销售额
    const monthSales = db.prepare(`
      SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE date LIKE ?
    `).get(`${currentMonth}%`) as { total: number };

    // 当月每日订单趋势
    const dailyOrders = db.prepare(`
      SELECT date, COUNT(*) as count, COALESCE(SUM(total_price), 0) as total
      FROM orders
      WHERE date LIKE ?
      GROUP BY date
      ORDER BY date
    `).all(`${currentMonth}%`) as Array<{ date: string; count: number; total: number }>;

    return NextResponse.json({
      todayOrders: todayOrders.count,
      todaySales: todaySales.total,
      monthOrders: monthOrders.count,
      monthSales: monthSales.total,
      dailyOrders,
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 });
  }
}