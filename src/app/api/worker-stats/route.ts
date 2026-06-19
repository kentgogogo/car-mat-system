import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET: 获取工人计件统计
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get('month') || new Date().toISOString().substring(0, 7);
  
  try {
    // 获取当月每个工人的计件数量
    const stats = db.prepare(`
      SELECT w.id, w.name, w.price_per_piece,
             COUNT(p.id) as piece_count,
             w.price_per_piece * COUNT(p.id) as total_salary
      FROM workers w
      LEFT JOIN production p ON w.name = p.worker_name 
        AND p.complete_time LIKE ?
      GROUP BY w.id
      ORDER BY piece_count DESC
    `).all(`${month}%`);
    
    // 获取月度总计
    const total = db.prepare(`
      SELECT COUNT(*) as total_pieces
      FROM production 
      WHERE complete_time LIKE ? AND status = '已完成'
    `).get(`${month}%`) as { total_pieces: number };
    
    return NextResponse.json({ stats, total, month });
  } catch (error) {
    console.error('获取工人统计失败:', error);
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
  }
}

// PUT: 更新工人单价
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    db.prepare(`
      UPDATE workers SET price_per_piece = ? WHERE id = ?
    `).run(body.price_per_piece, body.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新工人单价失败:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}