import { NextResponse } from 'next/server';
import { getDb, queryResult } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // 查询已发货状态的订单
    const stmt = db.prepare(`
      SELECT 
        order_no,
        date,
        customer_name,
        customer_phone,
        logistics,
        payment_status,
        brand,
        model,
        year_style,
        lower_material,
        upper_material,
        tail_mat,
        quantity,
        remark,
        status
      FROM orders 
      WHERE status = '已发货'
      ORDER BY date DESC, created_at DESC
    `);
    
    const orders = queryResult(stmt);
    
    // 格式化数据
    const shippingList = orders.map(order => ({
      order_no: order.order_no,
      date: order.date,
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      logistics: order.logistics || '',
      is_collect: order.payment_status === '代收' ? '是' : '否',
      vehicle: `${order.brand || ''} ${order.model || ''} ${order.year_style || ''}`.trim(),
      lower_material: order.lower_material || '',
      upper_material: order.upper_material || '',
      tail_mat: order.tail_mat || '',
      quantity: order.quantity || 1,
      remark: order.remark || ''
    }));
    
    return NextResponse.json({ shippingList });
  } catch (error) {
    console.error('获取发货列表失败:', error);
    return NextResponse.json({ shippingList: [] });
  }
}