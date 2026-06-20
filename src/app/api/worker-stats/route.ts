import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    // 获取工人列表及其计件统计
    const stats = db.prepare(`
      SELECT 
        w.id,
        w.name,
        w.price_per_piece,
        COUNT(p.id) as piece_count,
        COUNT(p.id) * w.price_per_piece as total_salary
      FROM workers w
      LEFT JOIN production p ON w.name = p.worker_name 
        AND p.complete_time LIKE ?
        AND p.status = '已完成'
      GROUP BY w.id
      ORDER BY piece_count DESC
    `).all(`${month}%`);

    // 计算总计件数
    const totalStats = db.prepare(`
      SELECT COUNT(*) as total_pieces
      FROM production
      WHERE complete_time LIKE ?
        AND status = '已完成'
    `).get(`${month}%`) as { total_pieces: number };

    return NextResponse.json({
      stats,
      total: totalStats,
      month
    });
  } catch (error) {
    console.error('获取工人统计失败:', error);
    return NextResponse.json({ error: '获取工人统计失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { workerId, pricePerPiece } = body;

    db.prepare('UPDATE workers SET price_per_piece = ? WHERE id = ?')
      .run(pricePerPiece, workerId);

    return NextResponse.json({ success: true, message: '单价更新成功' });
  } catch (error) {
    console.error('更新单价失败:', error);
    return NextResponse.json({ error: '更新单价失败' }, { status: 500 });
  }
}