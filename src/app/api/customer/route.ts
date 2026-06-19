import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: 获取客户列表或单个客户详情
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const keyword = searchParams.get('keyword') || '';
  
  if (id) {
    // 获取单个客户详情和历史订单
    const customer = db.prepare(`
      SELECT * FROM customers WHERE id = ?
    `).get(parseInt(id));
    
    const orders = db.prepare(`
      SELECT * FROM orders WHERE customer_name = ?
      ORDER BY date DESC
    `).all((customer as { name: string })?.name || '');
    
    const totalOrders = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total
      FROM orders WHERE customer_name = ?
    `).get((customer as { name: string })?.name || '') as { count: number; total: number };
    
    return NextResponse.json({ customer, orders, totalOrders });
  }
  
  // 获取客户列表
  const customers = db.prepare(`
    SELECT c.id, c.name, c.phone,
           (SELECT COUNT(*) FROM orders WHERE customer_name = c.name) as order_count
    FROM customers c
    WHERE c.name LIKE ?
    ORDER BY order_count DESC, c.name
  `).all(`%${keyword}%`);
  
  return NextResponse.json({ customers });
}

// POST: 添加新客户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    db.prepare(`
      INSERT INTO customers (name, phone) VALUES (?, ?)
    `).run(body.name, body.phone);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('添加客户失败:', error);
    return NextResponse.json({ error: '添加失败，客户可能已存在' }, { status: 500 });
  }
}

// PUT: 更新客户信息
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    db.prepare(`
      UPDATE customers SET name = ?, phone = ? WHERE id = ?
    `).run(body.name, body.phone, body.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新客户失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}