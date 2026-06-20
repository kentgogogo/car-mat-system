import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryResult, queryOne, safeSave } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const {
      order_no,
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
      quantity,
      unit_price,
      payment_status,
      remark,
      status
    } = body;

    const total_price = quantity * unit_price;

    db.run(`
      UPDATE orders SET
        date = ?, customer_name = ?, customer_phone = ?, logistics = ?,
        brand = ?, model = ?, year_style = ?, product_type = ?, version_no = ?, vin_code = ?,
        lower_material = ?, upper_material = ?, craft = ?, auxiliary = ?, tail_mat = ?,
        color = ?, quantity = ?, unit_price = ?, total_price = ?, payment_status = ?,
        remark = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_no = ?
    `, [
      date, customer_name, customer_phone, logistics,
      brand, model, year_style, product_type, version_no, vin_code || null,
      lower_material, upper_material, craft, auxiliary, tail_mat,
      color, quantity, unit_price, total_price, payment_status,
      remark, status, order_no
    ]);

    // 更新生产记录的产品信息
    const product_info = `${brand} ${model} ${year_style} ${product_type}`;
    db.run(`
      UPDATE production SET product_info = ?, quantity = ?
      WHERE order_no = ?
    `, [product_info, quantity, order_no]);

    safeSave();

    return NextResponse.json({
      success: true,
      message: '订单已更新'
    });
  } catch (error) {
    console.error('更新订单失败:', error);
    return NextResponse.json({
      success: false,
      error: '更新订单失败'
    }, { status: 500 });
  }
}