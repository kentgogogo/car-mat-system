import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDatabase } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT - 更新发货信息（支持订单来源和手动录入来源）
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const body = await request.json();
    
    // 解析 ID 来源
    const isManual = id.startsWith('manual_');
    const isOrder = id.startsWith('order_');
    
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
    
    if (isManual) {
      // 更新手动录入的发货记录
      const recordId = parseInt(id.replace('manual_', ''));
      db.run(`
        UPDATE shipping_records 
        SET customer_name = ?, vehicle = ?, logistics = ?, tracking_no = ?, is_collect = ?, 
            lower_material = ?, upper_material = ?, tail_mat = ?, remark = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [customer_name || '', vehicle || '', logistics || '', tracking_no || '', is_collect || '否', 
          lower_material || '', upper_material || '', tail_mat || '', remark || '', recordId]);
    } else if (isOrder) {
      // 更新订单来源的发货记录（只更新物流相关字段）
      const orderId = parseInt(id.replace('order_', ''));
      db.run(`
        UPDATE orders 
        SET logistics = ?, tracking_no = ?, remark = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [logistics || '', tracking_no || '', remark || '', orderId]);
    } else {
      // 兼容旧的纯数字 ID（订单 ID）
      const orderId = parseInt(id);
      db.run(`
        UPDATE orders 
        SET logistics = ?, tracking_no = ?, remark = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [logistics || '', tracking_no || '', remark || '', orderId]);
    }
    
    saveDatabase();
    
    return NextResponse.json({ 
      success: true, 
      message: '发货信息已更新' 
    });
  } catch (error) {
    console.error('更新发货信息失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '更新失败' 
    }, { status: 500 });
  }
}

// DELETE - 删除手动录入的发货记录
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const db = await getDb();
    const { id } = await params;
    
    // 只能删除手动录入的发货记录
    if (id.startsWith('manual_')) {
      const recordId = parseInt(id.replace('manual_', ''));
      db.run(`DELETE FROM shipping_records WHERE id = ?`, [recordId]);
      saveDatabase();
      return NextResponse.json({ 
        success: true, 
        message: '发货记录已删除' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: '只能删除手动录入的发货记录' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('删除发货记录失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '删除失败' 
    }, { status: 500 });
  }
}