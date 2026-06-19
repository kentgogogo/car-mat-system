import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...fields } = body;
    
    if (!id) {
      return NextResponse.json({ error: '缺少订单ID' }, { status: 400 });
    }
    
    // 计算总价
    const totalPrice = (fields.quantity || 1) * (fields.unit_price || 0);
    
    // 更新订单
    db.prepare(`
      UPDATE orders SET
        date = ?, customer_name = ?, customer_phone = ?, logistics = ?,
        brand = ?, model = ?, year_style = ?, product_type = ?, version_no = ?,
        lower_material = ?, upper_material = ?, craft = ?, auxiliary = ?, tail_mat = ?,
        color = ?, quantity = ?, unit_price = ?, total_price = ?, payment_status = ?,
        remark = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      fields.date,
      fields.customer_name,
      fields.customer_phone,
      fields.logistics,
      fields.brand,
      fields.model,
      fields.year_style,
      fields.product_type,
      fields.version_no,
      fields.lower_material,
      fields.upper_material,
      fields.craft,
      fields.auxiliary,
      fields.tail_mat,
      fields.color,
      fields.quantity,
      fields.unit_price,
      totalPrice,
      fields.payment_status,
      fields.remark,
      id
    );
    
    // 更新客户表（如果客户不存在）
    const existingCustomer = db.prepare(`
      SELECT id FROM customers WHERE name = ?
    `).get(fields.customer_name);
    
    if (!existingCustomer) {
      db.prepare(`
        INSERT INTO customers (name, phone) VALUES (?, ?)
      `).run(fields.customer_name, fields.customer_phone);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新订单失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}