import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderNo,
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
      quantity,
      unit_price,
      payment_status,
      remark,
      status
    } = body;

    const totalPrice = quantity * unit_price;

    db.prepare(`
      UPDATE orders SET
        date = ?, customer_name = ?, customer_phone = ?, logistics = ?,
        brand = ?, model = ?, year_style = ?, product_type = ?, version_no = ?,
        lower_material = ?, upper_material = ?, craft = ?, auxiliary = ?, tail_mat = ?,
        color = ?, quantity = ?, unit_price = ?, total_price = ?,
        payment_status = ?, remark = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_no = ?
    `).run(
      date, customer_name, customer_phone, logistics,
      brand, model, year_style, product_type, version_no,
      lower_material, upper_material, craft, auxiliary, tail_mat,
      color, quantity, unit_price, totalPrice,
      payment_status, remark, status, orderNo
    );

    // 更新生产表的产品信息
    const productInfo = `${brand || ''} ${model || ''} ${year_style || ''} ${product_type || ''}`;
    db.prepare(`
      UPDATE production SET product_info = ?, quantity = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE order_no = ?
    `).run(productInfo, quantity, status, orderNo);

    return NextResponse.json({ success: true, message: '订单更新成功' });
  } catch (error) {
    console.error('更新订单失败:', error);
    return NextResponse.json({ error: '更新订单失败' }, { status: 500 });
  }
}