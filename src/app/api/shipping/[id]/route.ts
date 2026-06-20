import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDatabase } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT - 更新发货信息（物流公司、物流单号、备注）
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const db = await getDb();
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    
    const { logistics, tracking_no, remark } = body;
    
    // 更新订单的发货信息
    db.run(`
      UPDATE orders 
      SET logistics = ?, tracking_no = ?, remark = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [logistics || '', tracking_no || '', remark || '', orderId]);
    
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