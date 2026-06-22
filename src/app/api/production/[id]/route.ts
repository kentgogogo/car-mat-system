import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, safeSave } from '@/lib/db';

// PUT - 更新生产记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const body = await request.json();
    
    const {
      status,
      worker_name,
      fee,
      worker_type,
      lower_material,
      upper_material,
      craft,
      auxiliary,
      quantity,
      version_no,
      tail_version_no,
      model
    } = body;

    // 构建更新字段
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status || null);
      
      // 如果状态改为已完成，记录完成时间
      if (status === '已完成') {
        updates.push('complete_time = ?');
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        values.push(now);
      }
    }
    
    if (worker_name !== undefined) {
      updates.push('worker_name = ?');
      values.push(worker_name || null);
    }
    
    if (fee !== undefined) {
      updates.push('fee = ?');
      values.push(fee || 0);
    }
    
    if (worker_type !== undefined) {
      updates.push('worker_type = ?');
      values.push(worker_type || null);
    }
    
    if (lower_material !== undefined) {
      updates.push('lower_material = ?');
      values.push(lower_material || null);
    }
    
    if (upper_material !== undefined) {
      updates.push('upper_material = ?');
      values.push(upper_material || null);
    }
    
    if (craft !== undefined) {
      updates.push('craft = ?');
      values.push(craft || null);
    }
    
    if (auxiliary !== undefined) {
      updates.push('auxiliary = ?');
      values.push(auxiliary || null);
    }
    
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(quantity || 1);
    }
    
    if (version_no !== undefined) {
      updates.push('version_no = ?');
      values.push(version_no || null);
    }
    
    if (tail_version_no !== undefined) {
      updates.push('tail_version_no = ?');
      values.push(tail_version_no || null);
    }
    
    if (model !== undefined) {
      updates.push('model = ?');
      values.push(model || null);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    if (updates.length === 1) {
      return NextResponse.json({
        success: false,
        error: '没有要更新的字段'
      }, { status: 400 });
    }
    
    const sql = `UPDATE production SET ${updates.join(', ')} WHERE id = ?`;
    values.push(parseInt(id));
    
    db.run(sql, values);
    safeSave();
    
    // 如果生产完成，同时更新订单状态
    if (status === '已完成') {
      const orderStmt = db.prepare(`
        SELECT order_no FROM production WHERE id = ?
      `);
      orderStmt.bind([parseInt(id)]);
      const production = queryOne(orderStmt);
      
      if (production && production.order_no) {
        db.run(`
          UPDATE orders SET status = '已完成', updated_at = CURRENT_TIMESTAMP
          WHERE order_no = ?
        `, [production.order_no]);
        safeSave();
      }
    }
    
    return NextResponse.json({
      success: true,
      message: '生产记录已更新'
    });
  } catch (error) {
    console.error('更新生产记录失败:', error);
    return NextResponse.json({
      success: false,
      error: '更新生产记录失败'
    }, { status: 500 });
  }
}

// DELETE - 删除生产记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb();
    const { id } = await params;
    
    db.run('DELETE FROM production WHERE id = ?', [parseInt(id)]);
    safeSave();
    
    return NextResponse.json({
      success: true,
      message: '生产记录已删除'
    });
  } catch (error) {
    console.error('删除生产记录失败:', error);
    return NextResponse.json({
      success: false,
      error: '删除生产记录失败'
    }, { status: 500 });
  }
}