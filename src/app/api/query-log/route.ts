import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryResult, queryOne, safeSave } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];

    // 获取今日查询记录
    const logsStmt = db.prepare(`
      SELECT id, vehicle_model, year, vin_code, product_type, pattern_code, guide_info, query_time
      FROM query_logs 
      WHERE query_date = ?
      ORDER BY query_time DESC
    `);
    logsStmt.bind([today]);
    const logs = queryResult(logsStmt);

    // 检查每条记录的订单状态
    const logsWithStatus = logs.map(log => {
      let order_status = '未下单';
      
      if (log.vin_code) {
        // 有 VIN 码时，匹配 pattern_code AND vin_code
        const stmt = db.prepare(`
          SELECT 1 FROM orders 
          WHERE date = ? AND version_no = ? AND vin_code = ?
          LIMIT 1
        `);
        stmt.bind([today, log.pattern_code, log.vin_code]);
        const result = queryOne(stmt);
        if (result) {
          order_status = '已下单';
        }
      } else {
        // 无 VIN 码时，只匹配 pattern_code
        const stmt = db.prepare(`
          SELECT 1 FROM orders 
          WHERE date = ? AND version_no = ?
          LIMIT 1
        `);
        stmt.bind([today, log.pattern_code]);
        const result = queryOne(stmt);
        if (result) {
          order_status = '已下单';
        }
      }
      
      return {
        ...log,
        order_status
      };
    });

    // 计算统计数据
    const total = logsWithStatus.length;
    const ordered = logsWithStatus.filter(l => l.order_status === '已下单').length;
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
      error: '获取查询记录失败',
      logs: [],
      stats: { total: 0, ordered: 0, unordered: 0 }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { vehicle_model, year, vin_code, product_type, pattern_code, guide_info } = body;

    // VIN 码处理：只取后四位
    const vin_code_value = vin_code ? String(vin_code).slice(-4) : null;

    const now = new Date();
    const query_time = now.toISOString().slice(0, 19).replace('T', ' ');
    const query_date = now.toISOString().split('T')[0];

    db.run(`
      INSERT INTO query_logs (vehicle_model, year, vin_code, product_type, pattern_code, guide_info, query_time, query_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [vehicle_model, year, vin_code_value, product_type, pattern_code, guide_info || null, query_time, query_date]);

    safeSave();

    // 获取插入的记录 ID
    const stmt = db.prepare('SELECT last_insert_rowid() as id');
    const result = queryOne(stmt);

    return NextResponse.json({
      success: true,
      id: result?.id || 0,
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