import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const orderNo = request.nextUrl.searchParams.get('order_no');
    const customerName = request.nextUrl.searchParams.get('customer_name');
    const status = request.nextUrl.searchParams.get('status');
    const detail = request.nextUrl.searchParams.get('detail');

    // 如果请求详情
    if (orderNo && detail === 'true') {
      const production = db.prepare(`
        SELECT p.*, o.customer_name, o.customer_phone, o.logistics,
               o.brand, o.model, o.year_style, o.version_no, o.product_type,
               o.lower_material, o.upper_material, o.craft, o.auxiliary,
               o.tail_mat, o.color, o.quantity, o.unit_price, o.total_price,
               o.payment_status, o.remark, o.date
        FROM production p
        LEFT JOIN orders o ON p.order_no = o.order_no
        WHERE p.order_no = ?
      `).get(orderNo);

      return NextResponse.json({ production });
    }

    // 列表查询
    let sql = `
      SELECT p.*, o.customer_name 
      FROM production p
      LEFT JOIN orders o ON p.order_no = o.order_no
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (orderNo) {
      sql += ' AND (p.order_no LIKE ? OR p.production_no LIKE ?)';
      params.push(`%${orderNo}%`, `%${orderNo}%`);
    }
    if (customerName) {
      sql += ' AND o.customer_name LIKE ?';
      params.push(`%${customerName}%`);
    }
    if (status && status !== '全部') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY p.created_at DESC';

    const productions = db.prepare(sql).all(...params);

    return NextResponse.json({ productions });
  } catch (error) {
    console.error('获取生产记录失败:', error);
    return NextResponse.json({ error: '获取生产记录失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productionId, status, workerName } = body;

    if (status === '已完成' && workerName) {
      db.prepare(`
        UPDATE production 
        SET status = ?, worker_name = ?, complete_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(status, workerName, productionId);
    } else {
      db.prepare(`
        UPDATE production SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(status, productionId);
    }

    return NextResponse.json({ success: true, message: '状态更新成功' });
  } catch (error) {
    console.error('更新生产状态失败:', error);
    return NextResponse.json({ error: '更新生产状态失败' }, { status: 500 });
  }
}