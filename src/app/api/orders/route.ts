import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const orderNo = request.nextUrl.searchParams.get('order_no');
    const customerName = request.nextUrl.searchParams.get('customer_name');
    const status = request.nextUrl.searchParams.get('status');
    const startDate = request.nextUrl.searchParams.get('start_date');
    const endDate = request.nextUrl.searchParams.get('end_date');

    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params: (string | number)[] = [];

    if (orderNo) {
      sql += ' AND order_no LIKE ?';
      params.push(`%${orderNo}%`);
    }
    if (customerName) {
      sql += ' AND customer_name LIKE ?';
      params.push(`%${customerName}%`);
    }
    if (status && status !== '全部') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY created_at DESC';

    const orders = db.prepare(sql).all(...params);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('获取订单失败:', error);
    return NextResponse.json({ error: '获取订单失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNo, status } = body;

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_no = ?')
      .run(status, orderNo);

    // 同步更新生产表状态
    db.prepare('UPDATE production SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_no = ?')
      .run(status, orderNo);

    return NextResponse.json({ success: true, message: '状态更新成功' });
  } catch (error) {
    console.error('更新状态失败:', error);
    return NextResponse.json({ error: '更新状态失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const orderNo = request.nextUrl.searchParams.get('order_no');
    
    if (!orderNo) {
      return NextResponse.json({ error: '缺少订单号' }, { status: 400 });
    }

    // 删除生产记录
    db.prepare('DELETE FROM production WHERE order_no = ?').run(orderNo);
    
    // 删除订单
    db.prepare('DELETE FROM orders WHERE order_no = ?').run(orderNo);

    return NextResponse.json({ success: true, message: '订单已删除' });
  } catch (error) {
    console.error('删除订单失败:', error);
    return NextResponse.json({ error: '删除订单失败' }, { status: 500 });
  }
}