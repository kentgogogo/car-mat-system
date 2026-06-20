import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDatabase } from '@/lib/db';

// 批量发货接口
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '请选择要发货的订单' 
      }, { status: 400 });
    }

    // 批量更新订单状态为已发货
    const placeholders = orderIds.map(() => '?').join(',');
    const sql = `UPDATE orders SET status = '已发货' WHERE id IN (${placeholders})`;
    
    db.run(sql, orderIds);

    // 保存数据库
    await saveDatabase();

    return NextResponse.json({
      success: true,
      message: `已将 ${orderIds.length} 个订单标记为已发货`,
      shippedCount: orderIds.length
    });
  } catch (error) {
    console.error('批量发货失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '批量发货失败' 
    }, { status: 500 });
  }
}