import { NextResponse } from 'next/server';
import { getDb, queryResult, saveDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // 1. 查询已发货状态的订单（source: order）
    const orderStmt = db.prepare(`
      SELECT 
        id,
        order_no,
        date,
        customer_name,
        customer_phone,
        logistics,
        tracking_no,
        payment_status,
        brand,
        model,
        year_style,
        lower_material,
        upper_material,
        tail_mat,
        quantity,
        remark,
        status
      FROM orders 
      WHERE status = '已发货'
      ORDER BY date DESC, created_at DESC
    `);
    
    const orders = queryResult(orderStmt);
    
    // 2. 查询手动录入的发货记录（source: manual）
    const manualStmt = db.prepare(`
      SELECT 
        id,
        customer_name,
        vehicle,
        logistics,
        tracking_no,
        is_collect,
        lower_material,
        upper_material,
        tail_mat,
        remark,
        source,
        order_id,
        order_no,
        created_at
      FROM shipping_records
      ORDER BY created_at DESC
    `);
    
    const manualRecords = queryResult(manualStmt);
    
    // 格式化订单来源的发货记录
    const orderList = orders.map(order => ({
      id: `order_${order.id}`,
      source: 'order',
      order_id: order.id,
      order_no: order.order_no,
      date: order.date,
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      logistics: order.logistics || '',
      tracking_no: order.tracking_no || '',
      is_collect: order.payment_status === '代收' ? '是' : '否',
      vehicle: `${order.brand || ''} ${order.model || ''} ${order.year_style || ''}`.trim(),
      lower_material: order.lower_material || '',
      upper_material: order.upper_material || '',
      tail_mat: order.tail_mat || '',
      quantity: order.quantity || 1,
      remark: order.remark || ''
    }));
    
    // 格式化手动录入的发货记录
    const manualList = manualRecords.map(record => ({
      id: `manual_${record.id}`,
      source: 'manual',
      record_id: record.id,
      order_no: record.order_no || '',
      date: record.created_at?.split('T')[0] || '',
      customer_name: record.customer_name || '',
      customer_phone: '',
      logistics: record.logistics || '',
      tracking_no: record.tracking_no || '',
      is_collect: record.is_collect || '否',
      vehicle: record.vehicle || '',
      lower_material: record.lower_material || '',
      upper_material: record.upper_material || '',
      tail_mat: record.tail_mat || '',
      quantity: 1,
      remark: record.remark || ''
    }));
    
    // 合并两种数据源
    const shippingList = [...orderList, ...manualList];
    
    return NextResponse.json({ shippingList });
  } catch (error) {
    console.error('获取发货列表失败:', error);
    return NextResponse.json({ shippingList: [] });
  }
}

// 新增手动发货记录
export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();
    
    const { 
      customer_name, 
      vehicle, 
      logistics, 
      tracking_no, 
      is_collect, 
      lower_material, 
      upper_material, 
      tail_mat, 
      remark 
    } = body;
    
    if (!customer_name) {
      return NextResponse.json({ success: false, error: '客户名称必填' }, { status: 400 });
    }
    
    db.run(`
      INSERT INTO shipping_records (customer_name, vehicle, logistics, tracking_no, is_collect, lower_material, upper_material, tail_mat, remark, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
    `, [customer_name, vehicle || '', logistics || '', tracking_no || '', is_collect || '否', lower_material || '', upper_material || '', tail_mat || '', remark || '']);
    
    saveDatabase();
    
    return NextResponse.json({ success: true, message: '发货记录已添加' });
  } catch (error) {
    console.error('添加发货记录失败:', error);
    return NextResponse.json({ success: false, error: '添加失败' }, { status: 500 });
  }
}