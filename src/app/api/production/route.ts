import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryResult, queryOne, safeSave } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const order_no = searchParams.get('order_no');
    const customer_name = searchParams.get('customer_name');
    const status = searchParams.get('status');
    const detail = searchParams.get('detail');

    // 查询特定订单的完整详情
    if (order_no && detail === 'true') {
      const orderStmt = db.prepare(`
        SELECT * FROM orders WHERE order_no = ?
      `);
      orderStmt.bind([order_no]);
      const order = queryOne(orderStmt);
      
      if (order) {
        const productionStmt = db.prepare(`
          SELECT * FROM production WHERE order_no = ?
        `);
        productionStmt.bind([order_no]);
        const production = queryOne(productionStmt);
        
        return NextResponse.json({
          success: true,
          order,
          production
        });
      }
      
      return NextResponse.json({
        success: false,
        error: '订单不存在'
      }, { status: 404 });
    }

    // 构建查询条件
    let whereClause = '1=1';
    const params: string[] = [];

    if (order_no) {
      whereClause += ' AND (p.order_no LIKE ? OR p.production_no LIKE ?)';
      params.push(`%${order_no}%`, `%${order_no}%`);
    }
    if (customer_name) {
      whereClause += ' AND o.customer_name LIKE ?';
      params.push(`%${customer_name}%`);
    }
    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    // 查询生产记录列表
    const stmt = db.prepare(`
      SELECT p.*, o.customer_name
      FROM production p
      LEFT JOIN orders o ON p.order_no = o.order_no
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
    `);
    if (params.length > 0) {
      stmt.bind(params);
    }
    const productions = queryResult(stmt);

    return NextResponse.json({ productions });
  } catch (error) {
    console.error('获取生产记录失败:', error);
    return NextResponse.json({ productions: [] });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { production_no, worker_name, status } = body;

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (status === '已完成') {
      db.run(`
        UPDATE production SET 
          status = '已完成',
          worker_name = ?,
          complete_time = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE production_no = ?
      `, [worker_name, now, production_no]);
    } else {
      db.run(`
        UPDATE production SET 
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE production_no = ?
      `, [status, production_no]);
    }

    // 如果生产完成，同时更新订单状态
    if (status === '已完成') {
      const orderStmt = db.prepare(`
        SELECT order_no FROM production WHERE production_no = ?
      `);
      orderStmt.bind([production_no]);
      const production = queryOne(orderStmt);
      
      if (production) {
        db.run(`
          UPDATE orders SET status = '已完成', updated_at = CURRENT_TIMESTAMP
          WHERE order_no = ?
        `, [production.order_no]);
      }
    }

    safeSave();

    return NextResponse.json({
      success: true,
      message: '生产状态已更新'
    });
  } catch (error) {
    console.error('更新生产状态失败:', error);
    return NextResponse.json({
      success: false,
      error: '更新生产状态失败'
    }, { status: 500 });
  }
}