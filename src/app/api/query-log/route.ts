import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// 获取今日日期字符串
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// GET: 获取今日查询记录
export async function GET(request: NextRequest) {
  try {
    const today = getTodayDate();
    
    // 获取今日所有查询记录
    const logs = db.prepare(`
      SELECT id, vehicle_model, year, vin_code, product_type, pattern_code, guide_info, query_time
      FROM query_logs
      WHERE query_date = ?
      ORDER BY query_time DESC
    `).all(today) as Array<{
      id: number;
      vehicle_model: string;
      year: string;
      vin_code: string | null;
      product_type: string;
      pattern_code: string;
      guide_info: string | null;
      query_time: string;
    }>;
    
    // 获取今日所有订单的版型号和VIN码
    const todayOrders = db.prepare(`
      SELECT DISTINCT version_no, vin_code
      FROM orders
      WHERE date = ?
    `).all(today) as Array<{ version_no: string; vin_code: string | null }>;
    
    // 添加订单状态：检查是否有相同 pattern_code AND vin_code 的订单
    // 如果 vin_code 为空，则只按 pattern_code 匹配
    const logsWithStatus = logs.map(log => {
      let hasOrder = false;
      
      if (log.vin_code) {
        // 有 VIN 码时，需要匹配 pattern_code AND vin_code
        hasOrder = todayOrders.some(o => 
          o.version_no === log.pattern_code && o.vin_code === log.vin_code
        );
      } else {
        // 无 VIN 码时，只匹配 pattern_code
        hasOrder = todayOrders.some(o => o.version_no === log.pattern_code);
      }
      
      return {
        ...log,
        order_status: hasOrder ? '已下单' : '未下单'
      };
    });
    
    // 计算统计
    const totalCount = logs.length;
    const orderedCount = logsWithStatus.filter(log => log.order_status === '已下单').length;
    const unorderedCount = totalCount - orderedCount;
    
    return NextResponse.json({
      success: true,
      logs: logsWithStatus,
      stats: {
        total: totalCount,
        ordered: orderedCount,
        unordered: unorderedCount
      }
    });
  } catch (error) {
    console.error('获取查询记录失败:', error);
    return NextResponse.json(
      { success: false, error: '获取查询记录失败' },
      { status: 500 }
    );
  }
}

// POST: 添加查询记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicle_model, year, vin_code, product_type, pattern_code, guide_info } = body;
    
    if (!vehicle_model || !year || !product_type || !pattern_code) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const today = getTodayDate();
    
    // 插入查询记录（vin_code 可选）
    const result = db.prepare(`
      INSERT INTO query_logs (vehicle_model, year, vin_code, product_type, pattern_code, guide_info, query_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(vehicle_model, year, vin_code || null, product_type, pattern_code, guide_info || null, today);
    
    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      message: '查询记录已保存'
    });
  } catch (error) {
    console.error('添加查询记录失败:', error);
    return NextResponse.json(
      { success: false, error: '添加查询记录失败' },
      { status: 500 }
    );
  }
}