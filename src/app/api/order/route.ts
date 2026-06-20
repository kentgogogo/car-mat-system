import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 获取客户联想
function getCustomers(keyword: string) {
  const customers = db.prepare(`
    SELECT DISTINCT name, phone FROM customers 
    WHERE name LIKE ? OR phone LIKE ?
    ORDER BY name
    LIMIT 10
  `).all(`%${keyword}%`, `%${keyword}%`) as { name: string; phone: string }[];
  return customers;
}

// 生成订单号
function generateOrderNo(date: string): string {
  const todayOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders WHERE date = ? AND order_no LIKE 'HC-%'
  `).get(date) as { count: number };
  
  const sequence = String(todayOrders.count + 1).padStart(3, '0');
  return `HC-${date}-${sequence}`;
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');
  const keyword = request.nextUrl.searchParams.get('keyword');

  if (action === 'customers' && keyword) {
    try {
      const customers = getCustomers(keyword);
      return NextResponse.json({ customers });
    } catch (error) {
      console.error('获取客户失败:', error);
      return NextResponse.json({ error: '获取客户失败' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: '无效的操作' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      date,
      customer_name,
      customer_phone,
      logistics,
      brand,
      model,
      year_style,
      product_type,
      version_no,
      lower_material,
      upper_material,
      craft,
      auxiliary,
      tail_mat,
      color,
      quantity = 1,
      unit_price,
      payment_status = '未付',
      remark
    } = body;

    // 生成订单号
    const orderNo = generateOrderNo(date);
    const totalPrice = quantity * unit_price;

    // 插入订单
    db.prepare(`
      INSERT INTO orders (
        order_no, date, customer_name, customer_phone, logistics,
        brand, model, year_style, product_type, version_no,
        lower_material, upper_material, craft, auxiliary, tail_mat,
        color, quantity, unit_price, total_price, payment_status, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderNo, date, customer_name, customer_phone, logistics,
      brand, model, year_style, product_type, version_no,
      lower_material, upper_material, craft, auxiliary, tail_mat,
      color, quantity, unit_price, totalPrice, payment_status, remark
    );

    // 如果客户不存在，添加客户
    if (customer_name && customer_phone) {
      const existingCustomer = db.prepare(`
        SELECT id FROM customers WHERE name = ? AND phone = ?
      `).get(customer_name, customer_phone);
      
      if (!existingCustomer) {
        db.prepare(`INSERT INTO customers (name, phone) VALUES (?, ?)`).run(customer_name, customer_phone);
      }
    }

    // 创建生产记录
    const productionNo = `P-${orderNo}`;
    const productInfo = `${brand || ''} ${model || ''} ${year_style || ''} ${product_type || ''}`;
    
    db.prepare(`
      INSERT INTO production (production_no, order_no, product_info, quantity)
      VALUES (?, ?, ?, ?)
    `).run(productionNo, orderNo, productInfo, quantity);

    return NextResponse.json({
      success: true,
      orderNo,
      message: '订单创建成功'
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 });
  }
}