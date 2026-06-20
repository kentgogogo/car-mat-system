import { NextResponse } from 'next/server';
import { getDb, queryResult, queryOne, safeSave } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const today = new Date().toISOString().slice(0, 10);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthStart = `${currentMonth}-01`;

    // 今日订单数和销售额
    const todayStmt = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total 
      FROM orders WHERE date = ?
    `);
    todayStmt.bind([today]);
    const todayData = queryOne(todayStmt) || { count: 0, total: 0 };

    // 本月订单数和销售额
    const monthStmt = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total 
      FROM orders WHERE date >= ?
    `);
    monthStmt.bind([monthStart]);
    const monthData = queryOne(monthStmt) || { count: 0, total: 0 };

    // 当月每日订单趋势（取最近30天）
    const dailyStmt = db.prepare(`
      SELECT date, COUNT(*) as count, COALESCE(SUM(total_price), 0) as total
      FROM orders 
      WHERE date >= ?
      GROUP BY date 
      ORDER BY date DESC
      LIMIT 30
    `);
    dailyStmt.bind([monthStart]);
    const dailyOrders = queryResult(dailyStmt).reverse();

    return NextResponse.json({
      todayOrders: todayData.count || 0,
      todaySales: todayData.total || 0,
      monthOrders: monthData.count || 0,
      monthSales: monthData.total || 0,
      dailyOrders
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 });
  }
}