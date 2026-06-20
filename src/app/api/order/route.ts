import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryResult, queryOne, safeSave } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const keyword = searchParams.get('keyword');

    // 获取客户联想列表
    if (action === 'customers' && keyword) {
      const stmt = db.prepare(`
        SELECT DISTINCT name, phone FROM customers 
        WHERE name LIKE ?
        ORDER BY name
        LIMIT 10
      `);
      stmt.bind([`%${keyword}%`]);
      const customers = queryResult(stmt);
      return NextResponse.json({ customers });
    }

    return NextResponse.json({ customers: [] });
  } catch (error) {
    console.error('获取客户联想失败:', error);
    return NextResponse.json({ customers: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
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
      vin_code,
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

    const total_price = quantity * unit_price;

    // 生成订单号：HC-YYYY-MM-DD-三位流水号
    const prefix = `HC-${date.replace(/-/g, '-')}`;
    
    // 查询当天已有订单数量
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE order_no LIKE ?
    `);
    countStmt.bind([`${prefix}%`]);
    const countResult = queryOne(countStmt);
    const serialNo = ((countResult?.count || 0) + 1).toString().padStart(3, '0');
    const order_no = `${prefix}-${serialNo}`;

    // 生成生产编号
    const production_no = `P-${order_no}`;

    // 插入订单
    db.run(`
      INSERT INTO orders (
        order_no, date, customer_name, customer_phone, logistics,
        brand, model, year_style, product_type, version_no, vin_code,
        lower_material, upper_material, craft, auxiliary, tail_mat,
        color, quantity, unit_price, total_price, payment_status, remark, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '待裁剪')
    `, [
      order_no, date, customer_name, customer_phone, logistics,
      brand, model, year_style, product_type, version_no, vin_code || null,
      lower_material, upper_material, craft, auxiliary, tail_mat,
      color, quantity, unit_price, total_price, payment_status, remark
    ]);

    // 插入生产记录
    const product_info = `${brand} ${model} ${year_style} ${product_type}`;
    db.run(`
      INSERT INTO production (production_no, order_no, product_info, quantity, status)
      VALUES (?, ?, ?, ?, '待生产')
    `, [production_no, order_no, product_info, quantity]);

    // 如果客户名是新客户，自动添加到客户表
    if (customer_name) {
      const customerStmt = db.prepare(`
        SELECT id FROM customers WHERE name = ?
      `);
      customerStmt.bind([customer_name]);
      const existingCustomer = queryOne(customerStmt);
      
      if (!existingCustomer) {
        db.run(`
          INSERT INTO customers (name, phone) VALUES (?, ?)
        `, [customer_name, customer_phone || null]);
      }
    }

    safeSave();

    return NextResponse.json({
      success: true,
      orderNo: order_no,
      message: '订单创建成功'
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    return NextResponse.json({
      success: false,
      error: '创建订单失败'
    }, { status: 500 });
  }
}