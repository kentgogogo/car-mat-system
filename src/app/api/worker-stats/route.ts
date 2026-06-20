import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryResult, safeSave } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    // 查询工人统计
    const stmt = db.prepare(`
      SELECT 
        w.id, w.name, w.price_per_piece,
        COUNT(p.id) as piece_count,
        w.price_per_piece * COUNT(p.id) as total_salary
      FROM workers w
      LEFT JOIN production p ON w.name = p.worker_name 
        AND strftime('%Y-%m', p.complete_time) = ?
      GROUP BY w.id
      ORDER BY piece_count DESC
    `);
    stmt.bind([month]);
    const stats = queryResult(stmt);

    // 计算总计
    const totalStmt = db.prepare(`
      SELECT COUNT(*) as total_pieces FROM production 
      WHERE strftime('%Y-%m', complete_time) = ?
    `);
    totalStmt.bind([month]);
    const totalResult = queryResult(totalStmt);
    const total_pieces = totalResult[0]?.total_pieces || 0;

    return NextResponse.json({
      stats,
      total: { total_pieces },
      month
    });
  } catch (error) {
    console.error('获取工人统计失败:', error);
    return NextResponse.json({
      stats: [],
      total: { total_pieces: 0 },
      month: new Date().toISOString().slice(0, 7)
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { worker_id, price_per_piece } = body;

    db.run(`
      UPDATE workers SET price_per_piece = ? WHERE id = ?
    `, [price_per_piece, worker_id]);

    safeSave();

    return NextResponse.json({
      success: true,
      message: '单价已更新'
    });
  } catch (error) {
    console.error('更新单价失败:', error);
    return NextResponse.json({
      success: false,
      error: '更新单价失败'
    }, { status: 500 });
  }
}