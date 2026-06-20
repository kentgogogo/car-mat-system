import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryResult, queryOne, safeSave, calculateFees } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const keyword = searchParams.get('keyword');

    // 获取客户联想列表
    if (action === 'customers' && keyword) {
      const stmt = db.prepare(`
        SELECT DISTINCT name, phone, logistics, is_collect, remark FROM customers 
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
      line_mark,
      vin_code,
      set_type = '全套',
      embroidery_type = '无',
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

    // 计算工价
    const { sewingFee, embroideryFee } = calculateFees(
      product_type || '脚垫',
      set_type,
      embroidery_type
    );

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
        brand, model, year_style, product_type, version_no, line_mark, vin_code,
        set_type, embroidery_type, sewing_fee, embroidery_fee,
        lower_material, upper_material, craft, auxiliary, tail_mat,
        color, quantity, unit_price, total_price, payment_status, remark, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '待裁剪')
    `, [
      order_no, date, customer_name, customer_phone, logistics,
      brand, model, year_style, product_type, version_no, line_mark || null, vin_code || null,
      set_type, embroidery_type, sewingFee, embroideryFee,
      lower_material, upper_material, craft, auxiliary, tail_mat,
      color, quantity, unit_price, total_price, payment_status, remark
    ]);

    // 插入生产记录（车工）
    const product_info = `${brand} ${model} ${year_style} ${product_type}`;
    db.run(`
      INSERT INTO production (production_no, order_no, product_info, quantity, status, worker_type, fee)
      VALUES (?, ?, ?, ?, '待生产', '车工', ?)
    `, [production_no, order_no, product_info, quantity, sewingFee]);

    // 如果有绣线，插入绣线生产记录
    if (embroideryFee > 0) {
      const embroidery_production_no = `E-${order_no}`;
      db.run(`
        INSERT INTO production (production_no, order_no, product_info, quantity, status, worker_type, fee)
        VALUES (?, ?, ?, ?, '待生产', '绣线', ?)
      `, [embroidery_production_no, order_no, `${product_info} 绣线`, quantity, embroideryFee]);
    }

    // 如果客户名是新客户，自动添加到客户表（包含物流等信息）
    if (customer_name) {
      const customerStmt = db.prepare(`
        SELECT id FROM customers WHERE name = ?
      `);
      customerStmt.bind([customer_name]);
      const existingCustomer = queryOne(customerStmt);
      
      if (!existingCustomer) {
        db.run(`
          INSERT INTO customers (name, phone, logistics, is_collect, remark)
          VALUES (?, ?, ?, ?, ?)
        `, [customer_name, customer_phone || null, logistics || null, '否', null]);
      } else {
        // 更新客户信息（如果有新信息）
        if (logistics || customer_phone) {
          db.run(`
            UPDATE customers SET phone = ?, logistics = ? WHERE name = ?
          `, [customer_phone || null, logistics || null, customer_name]);
        }
      }
    }

    safeSave();

    return NextResponse.json({
      success: true,
      orderNo: order_no,
      sewingFee,
      embroideryFee,
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