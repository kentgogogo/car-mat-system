import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: 获取生产列表或单个生产记录
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const orderNo = searchParams.get('order_no');
  const customerName = searchParams.get('customer_name');
  const status = searchParams.get('status');
  const getDetail = searchParams.get('detail');
  
  if (id) {
    // 获取单个生产记录
    const production = db.prepare(`
      SELECT p.*, o.customer_name, o.brand, o.model, o.year_style,
             o.lower_material, o.upper_material, o.craft, o.color
      FROM production p
      LEFT JOIN orders o ON p.order_no = o.order_no
      WHERE p.id = ?
    `).get(parseInt(id));
    
    return NextResponse.json({ production });
  }
  
  if (orderNo && getDetail === 'true') {
    // 获取完整订单详情
    const production = db.prepare(`
      SELECT p.*, 
             o.customer_name, o.customer_phone, o.date, o.logistics,
             o.brand, o.model, o.year_style, o.product_type, o.version_no,
             o.lower_material, o.upper_material, o.craft, o.auxiliary, o.tail_mat,
             o.color, o.quantity, o.unit_price, o.payment_status, o.remark, o.status as order_status
      FROM production p
      LEFT JOIN orders o ON p.order_no = o.order_no
      WHERE p.order_no = ?
    `).get(orderNo);
    
    return NextResponse.json({ production });
  }
  
  if (orderNo) {
    // 根据订单号获取生产记录
    const production = db.prepare(`
      SELECT p.*, o.customer_name, o.brand, o.model, o.year_style,
             o.lower_material, o.upper_material, o.craft, o.color
      FROM production p
      LEFT JOIN orders o ON p.order_no = o.order_no
      WHERE p.order_no = ?
    `).get(orderNo);
    
    return NextResponse.json({ production });
  }
  
  // 构建筛选条件
  let sql = `
    SELECT p.*, o.customer_name
    FROM production p
    LEFT JOIN orders o ON p.order_no = o.order_no
  `;
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  
  if (customerName) {
    conditions.push('o.customer_name LIKE ?');
    params.push(`%${customerName}%`);
  }
  
  if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY p.created_at DESC';
  
  // 获取所有生产列表（支持筛选）
  const productions = db.prepare(sql).all(...params);
  
  return NextResponse.json({ productions });
}

// PUT: 更新生产状态（工人计件）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    db.prepare(`
      UPDATE production 
      SET status = ?, worker_name = ?, complete_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run('已完成', body.worker_name, body.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新生产记录失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}