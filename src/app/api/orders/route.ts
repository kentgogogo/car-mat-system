import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: 获取订单列表
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  
  if (id) {
    // 获取单个订单详情
    const order = db.prepare(`
      SELECT * FROM orders WHERE id = ?
    `).get(parseInt(id));
    
    return NextResponse.json({ order });
  }
  
  // 获取订单列表，支持筛选
  const customer = searchParams.get('customer') || '';
  const status = searchParams.get('status') || '';
  const date = searchParams.get('date') || '';
  
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params: string[] = [];
  
  if (customer) {
    sql += ' AND customer_name LIKE ?';
    params.push(`%${customer}%`);
  }
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  if (date) {
    sql += ' AND date = ?';
    params.push(date);
  }
  
  sql += ' ORDER BY date DESC, created_at DESC';
  
  const orders = db.prepare(sql).all(...params);
  
  return NextResponse.json({ orders });
}

// PUT: 更新订单状态
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    db.prepare(`
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(body.status, body.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// DELETE: 删除订单
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: '缺少订单ID' }, { status: 400 });
  }
  
  try {
    // 先删除相关的生产记录
    const order = db.prepare('SELECT order_no FROM orders WHERE id = ?').get(parseInt(id)) as { order_no: string } | undefined;
    
    if (order) {
      db.prepare('DELETE FROM production WHERE order_no = ?').run(order.order_no);
    }
    
    // 删除订单
    db.prepare('DELETE FROM orders WHERE id = ?').run(parseInt(id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除订单失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}