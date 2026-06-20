import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryResult, queryOne, safeSave } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const phone = searchParams.get('phone');

    let whereClause = '1=1';
    const params: string[] = [];

    if (keyword) {
      whereClause += ' AND name LIKE ?';
      params.push(`%${keyword}%`);
    }
    if (phone) {
      whereClause += ' AND phone LIKE ?';
      params.push(`%${phone}%`);
    }

    const stmt = db.prepare(`
      SELECT c.*, COUNT(o.id) as order_count
      FROM customers c
      LEFT JOIN orders o ON c.name = o.customer_name
      WHERE ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    if (params.length > 0) {
      stmt.bind(params);
    }
    const customers = queryResult(stmt);

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('获取客户列表失败:', error);
    return NextResponse.json({ customers: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { name, phone } = body;

    // 检查客户是否已存在
    const stmt = db.prepare(`
      SELECT * FROM customers WHERE name = ?
    `);
    stmt.bind([name]);
    const existing = queryOne(stmt);

    if (existing) {
      // 更新电话
      if (phone) {
        db.run(`
          UPDATE customers SET phone = ? WHERE name = ?
        `, [phone, name]);
        safeSave();
      }
      return NextResponse.json({
        success: true,
        customer: existing,
        message: '客户已存在'
      });
    }

    // 新增客户
    db.run(`
      INSERT INTO customers (name, phone)
      VALUES (?, ?)
    `, [name, phone || null]);

    safeSave();

    const newStmt = db.prepare(`
      SELECT * FROM customers WHERE name = ?
    `);
    newStmt.bind([name]);
    const customer = queryOne(newStmt);

    return NextResponse.json({
      success: true,
      customer,
      message: '客户添加成功'
    });
  } catch (error) {
    console.error('添加客户失败:', error);
    return NextResponse.json({
      success: false,
      error: '添加客户失败'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { id, phone } = body;

    db.run(`
      UPDATE customers SET phone = ? WHERE id = ?
    `, [phone, id]);

    safeSave();

    return NextResponse.json({
      success: true,
      message: '客户信息已更新'
    });
  } catch (error) {
    console.error('更新客户失败:', error);
    return NextResponse.json({
      success: false,
      error: '更新客户失败'
    }, { status: 500 });
  }
}