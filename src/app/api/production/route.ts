import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: 获取生产列表或单个生产记录
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const orderNo = searchParams.get('order_no');
  
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
  
  // 获取所有生产列表
  const productions = db.prepare(`
    SELECT p.*, o.customer_name
    FROM production p
    LEFT JOIN orders o ON p.order_no = o.order_no
    ORDER BY p.created_at DESC
  `).all();
  
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