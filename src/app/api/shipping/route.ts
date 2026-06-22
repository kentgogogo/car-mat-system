import { NextResponse } from 'next/server';
import { getDb, queryResult, saveDatabase } from '@/lib/db';

// 生成订单号
function generateOrderNo(db: any): string {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 查询今天已有的订单数量
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE date LIKE ? OR order_no LIKE ?
  `);
  stmt.bind([`${dateStr}%`, `HC-${dateStr}%`]);
  stmt.step();
  const row = (stmt as any).getAsObject();
  stmt.free();
  
  const count = row?.count || 0;
  const seq = (count + 1).toString().padStart(3, '0');
  
  return `HC-${dateStr}-${seq}`;
}

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

// 新增发货记录（可同时创建订单）
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
      remark,
      create_order  // 是否同时创建订单
    } = body;
    
    if (!customer_name) {
      return NextResponse.json({ success: false, error: '客户名称必填' }, { status: 400 });
    }
    
    let orderNo = '';
    let orderId = null;
    
    // 如果需要同时创建订单
    if (create_order) {
      orderNo = generateOrderNo(db);
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      
      // 解析车型
      const vehicleParts = (vehicle || '').split(' ');
      const brand = vehicleParts[0] || '';
      const model = vehicleParts[1] || '';
      const yearStyle = vehicleParts[2] || '';
      
      // 确定付款状态
      const paymentStatus = is_collect === '是' ? '代收' : '未付';
      
      // 创建订单（状态为已发货）
      db.run(`
        INSERT INTO orders (
          order_no, date, customer_name, customer_phone,
          brand, model, year_style,
          product_type, version_no, line_mark,
          lower_material, upper_material, tail_mat,
          quantity, unit_price, total_price,
          payment_status, logistics, remark, status,
          created_at, updated_at, tracking_no
        ) VALUES (?, ?, ?, ?, ?, ?, ?, '软包', '', '', ?, ?, ?, 1, 0, 0, ?, ?, ?, '已发货', ?, ?, ?)
      `, [
        orderNo, now, customer_name, '',
        brand, model, yearStyle,
        lower_material || '', upper_material || '', tail_mat || '',
        paymentStatus, logistics || '', remark || '',
        now, now, tracking_no || ''
      ]);
      
      // 获取刚插入的订单ID
      const idStmt = db.prepare('SELECT last_insert_rowid() as id');
      idStmt.step();
      const idRow = (idStmt as any).getAsObject();
      idStmt.free();
      orderId = idRow?.id || null;
    }
    
    // 创建发货记录（关联订单）
    db.run(`
      INSERT INTO shipping_records (customer_name, vehicle, logistics, tracking_no, is_collect, lower_material, upper_material, tail_mat, remark, source, order_id, order_no)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?)
    `, [customer_name, vehicle || '', logistics || '', tracking_no || '', is_collect || '否', lower_material || '', upper_material || '', tail_mat || '', remark || '', orderId || null, orderNo || '']);
    
    saveDatabase();
    
    return NextResponse.json({ 
      success: true, 
      message: create_order ? '发货记录已添加，订单已创建' : '发货记录已添加',
      order_no: orderNo || undefined
    });
  } catch (error) {
    console.error('添加发货记录失败:', error);
    return NextResponse.json({ success: false, error: '添加失败' }, { status: 500 });
  }
}