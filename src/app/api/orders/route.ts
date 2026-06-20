import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryResult, queryOne, safeSave } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const order_no = searchParams.get('order_no');
    const customer = searchParams.get('customer');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    // 查询特定订单详情
    if (order_no) {
      const stmt = db.prepare(`
        SELECT * FROM orders WHERE order_no = ?
      `);
      stmt.bind([order_no]);
      const order = queryOne(stmt);
      return NextResponse.json({ order });
    }

    // 构建查询条件
    let whereClause = '1=1';
    const params: string[] = [];

    if (customer) {
      whereClause += ' AND customer_name LIKE ?';
      params.push(`%${customer}%`);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    if (date) {
      whereClause += ' AND date = ?';
      params.push(date);
    }

    // 查询订单列表
    const stmt = db.prepare(`
      SELECT * FROM orders 
      WHERE ${whereClause}
      ORDER BY date DESC, created_at DESC
    `);
    if (params.length > 0) {
      stmt.bind(params);
    }
    const orders = queryResult(stmt);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    return NextResponse.json({ orders: [] });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { order_no, status } = body;

    db.run(`
      UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_no = ?
    `, [status, order_no]);

    safeSave();

    return NextResponse.json({
      success: true,
      message: '订单状态已更新'
    });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    return NextResponse.json({
      success: false,
      error: '更新订单状态失败'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const order_no = searchParams.get('order_no');

    if (!order_no) {
      return NextResponse.json({
        success: false,
        error: '订单号不能为空'
      }, { status: 400 });
    }

    // 删除订单
    db.run('DELETE FROM orders WHERE order_no = ?', [order_no]);
    
    // 删除关联的生产记录
    db.run('DELETE FROM production WHERE order_no = ?', [order_no]);

    safeSave();

    return NextResponse.json({
      success: true,
      message: '订单已删除'
    });
  } catch (error) {
    console.error('删除订单失败:', error);
    return NextResponse.json({
      success: false,
      error: '删除订单失败'
    }, { status: 500 });
  }
}