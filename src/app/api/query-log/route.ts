import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // 获取今日查询记录
    const logs = db.prepare(`
      SELECT * FROM query_logs
      WHERE query_date = ?
      ORDER BY query_time DESC
    `).all(today);

    // 检查每个记录的订单状态
    const logsWithStatus = logs.map((log: any) => {
      let orderStatus = '未下单';
      
      if (log.vin_code) {
        // 有VIN码时，匹配 pattern_code AND vin_code
        const order = db.prepare(`
          SELECT * FROM orders 
          WHERE date = ? AND version_no = ? AND vin_code = ?
        `).get(today, log.pattern_code, log.vin_code);
        if (order) orderStatus = '已下单';
      } else {
        // 无VIN码时，只匹配 pattern_code
        const order = db.prepare(`
          SELECT * FROM orders 
          WHERE date = ? AND version_no = ?
        `).get(today, log.pattern_code);
        if (order) orderStatus = '已下单';
      }

      return { ...log, order_status: orderStatus };
    });

    // 计算统计数据
    const total = logsWithStatus.length;
    const ordered = logsWithStatus.filter((l: any) => l.order_status === '已下单').length;
    const unordered = total - ordered;

    return NextResponse.json({
      success: true,
      logs: logsWithStatus,
      stats: { total, ordered, unordered }
    });
  } catch (error) {
    console.error('获取查询记录失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '获取查询记录失败' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicle_model, year, vin_code, product_type, pattern_code, guide_info } = body;

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const result = db.prepare(`
      INSERT INTO query_logs (vehicle_model, year, vin_code, product_type, pattern_code, guide_info, query_time, query_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(vehicle_model, year, vin_code || null, product_type, pattern_code, guide_info || null, now, today);

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      message: '查询记录已保存'
    });
  } catch (error) {
    console.error('保存查询记录失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '保存查询记录失败' 
    }, { status: 500 });
  }
}