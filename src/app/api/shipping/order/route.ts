import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryResult, queryOne, safeSave } from '@/lib/db';

// POST - 添加订单（直接保存为已发货状态）
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    const {
      customer_name,
      vehicle,
      logistics,
      is_collect,
      lower_material,
      upper_material,
      tail_mat,
      remark
    } = body;
    
    if (!customer_name || !customer_name.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: '请输入客户名称' 
      }, { status: 400 });
    }
    
    // 生成订单号：HC-YYYY-MM-DD-XXX
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const prefix = `HC-${dateStr}`;
    
    // 获取今天已有订单数量
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE order_no LIKE ?
    `);
    countStmt.bind([`${prefix}%`]);
    const countResult = queryOne(countStmt);
    const todayCount = (countResult?.count as number) || 0;
    const orderNo = `${prefix}-${String(todayCount + 1).padStart(3, '0')}`;
    
    // 创建订单并直接标记为已发货
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // 解析车型为品牌、型号、年款
    const vehicleParts = (vehicle || '').split(' ');
    const brand = vehicleParts[0] || '';
    const model = vehicleParts[1] || '';
    const yearStyle = vehicleParts[2] || '';
    
    // 插入订单（is_collect 信息存入 remark）
    const remarkWithCollect = is_collect === '是' 
      ? `[代收] ${remark || ''}` 
      : remark || '';
    
    db.run(`
      INSERT INTO orders (
        order_no, date, customer_name, customer_phone,
        brand, model, year_style,
        product_type, quantity,
        lower_material, upper_material, tail_mat,
        logistics, payment_status,
        status, remark, tracking_no,
        set_type, embroidery_type,
        sewing_fee, embroidery_fee, line_mark, version_no,
        craft, auxiliary, color, unit_price, total_price
      ) VALUES (
        ?, ?, ?, '',
        ?, ?, ?,
        '软包', 1,
        ?, ?, ?,
        ?, ?,
        '已发货', ?, '',
        '全套', '无',
        0, 0, '', '',
        '', '', '', 0, 0
      )
    `, [
      orderNo, now, customer_name.trim(),
      brand, model, yearStyle,
      lower_material?.trim() || '',
      upper_material?.trim() || '',
      tail_mat?.trim() || '',
      logistics?.trim() || '',
      is_collect === '是' ? '代收' : '未付',
      remarkWithCollect.trim()
    ]);
    
    safeSave();
    
    return NextResponse.json({
      success: true,
      message: '订单已添加并标记为已发货',
      order_no: orderNo
    });
    
  } catch (error) {
    console.error('添加订单失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '添加订单失败' 
    }, { status: 500 });
  }
}