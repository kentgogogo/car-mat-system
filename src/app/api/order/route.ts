import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// 生成订单号: HC-YYYY-MM-DD-三位流水号
function generateOrderNo(date: string): string {
  const prefix = `HC-${date}`;
  
  // 查询当天已有的订单数量
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM orders WHERE order_no LIKE ?
  `).get(`${prefix}%`) as { count: number };
  
  const sequence = String(result.count + 1).padStart(3, '0');
  return `${prefix}-${sequence}`;
}

// GET: 获取客户列表（用于联想）
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  
  if (action === 'customers') {
    // 获取客户列表
    const keyword = searchParams.get('keyword') || '';
    const customers = db.prepare(`
      SELECT name, phone FROM customers 
      WHERE name LIKE ?
      ORDER BY name
      LIMIT 10
    `).all(`%${keyword}%`) as Array<{ name: string; phone: string }>;
    
    return NextResponse.json({ customers });
  }
  
  return NextResponse.json({ error: '未知操作' }, { status: 400 });
}

// POST: 创建新订单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 计算总价
    const totalPrice = body.quantity * body.unit_price;
    
    // 生成订单号
    const orderNo = generateOrderNo(body.date);
    
    // 插入订单
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_no, date, customer_name, customer_phone, logistics,
        brand, model, year_style, product_type, version_no,
        lower_material, upper_material, craft, auxiliary, tail_mat,
        color, quantity, unit_price, total_price, payment_status,
        remark, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertOrder.run(
      orderNo,
      body.date,
      body.customer_name,
      body.customer_phone,
      body.logistics,
      body.brand,
      body.model,
      body.year_style,
      body.product_type,
      body.version_no,
      body.lower_material,
      body.upper_material,
      body.craft,
      body.auxiliary,
      body.tail_mat,
      body.color,
      body.quantity,
      body.unit_price,
      totalPrice,
      body.payment_status,
      body.remark,
      '待裁剪'
    );
    
    // 如果客户不存在，添加到客户表
    const existingCustomer = db.prepare(`
      SELECT id FROM customers WHERE name = ?
    `).get(body.customer_name);
    
    if (!existingCustomer) {
      db.prepare(`
        INSERT INTO customers (name, phone) VALUES (?, ?)
      `).run(body.customer_name, body.customer_phone);
    }
    
    // 自动创建生产记录
    const productionNo = `P-${orderNo}`;
    const productInfo = `${body.brand} ${body.model} ${body.year_style} ${body.product_type}`;
    
    db.prepare(`
      INSERT INTO production (
        production_no, order_no, product_info, quantity, status
      ) VALUES (?, ?, ?, ?, ?)
    `).run(productionNo, orderNo, productInfo, body.quantity, '待生产');
    
    return NextResponse.json({ 
      success: true, 
      orderNo,
      message: '订单创建成功'
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    return NextResponse.json({ 
      error: '创建订单失败',
      message: String(error)
    }, { status: 500 });
  }
}