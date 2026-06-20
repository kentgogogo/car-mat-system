import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const keyword = searchParams.get('keyword');

    if (action === 'search') {
      const customers = db.prepare(`
        SELECT * FROM customers 
        WHERE name LIKE ? OR phone LIKE ?
        ORDER BY created_at DESC
      `).all(`%${keyword || ''}%`, `%${keyword || ''}%`);
      return NextResponse.json({ customers });
    }

    // 获取客户列表
    const customers = db.prepare(`
      SELECT c.*, COUNT(o.id) as order_count
      FROM customers c
      LEFT JOIN orders o ON c.name = o.customer_name
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all();

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('获取客户失败:', error);
    return NextResponse.json({ error: '获取客户失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    // 检查是否已存在
    const existing = db.prepare('SELECT * FROM customers WHERE name = ?').get(name);
    if (existing) {
      return NextResponse.json({ 
        success: true, 
        customer: existing,
        message: '客户已存在' 
      });
    }

    // 新增客户
    const result = db.prepare(`
      INSERT INTO customers (name, phone, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(name, phone || '');

    return NextResponse.json({ 
      success: true, 
      customerId: result.lastInsertRowid,
      message: '客户添加成功' 
    });
  } catch (error) {
    console.error('添加客户失败:', error);
    return NextResponse.json({ error: '添加客户失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, phone } = body;

    db.prepare('UPDATE customers SET name = ?, phone = ? WHERE id = ?')
      .run(name, phone, id);

    return NextResponse.json({ success: true, message: '客户更新成功' });
  } catch (error) {
    console.error('更新客户失败:', error);
    return NextResponse.json({ error: '更新客户失败' }, { status: 500 });
  }
}