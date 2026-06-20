import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryResult, safeSave } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    // 查询工人统计（包含工价计算）
    const stmt = db.prepare(`
      SELECT 
        w.id, w.name, w.price_per_piece,
        w.sewing_full, w.sewing_half, w.sewing_quarter,
        w.embroidery_full, w.embroidery_half, w.embroidery_tail,
        COUNT(p.id) as piece_count,
        SUM(COALESCE(p.fee, w.price_per_piece)) as total_salary
      FROM workers w
      LEFT JOIN production p ON w.name = p.worker_name 
        AND strftime('%Y-%m', p.complete_time) = ?
      GROUP BY w.id
      ORDER BY piece_count DESC
    `);
    stmt.bind([month]);
    const stats = queryResult(stmt);

    // 查询按工种分类的统计
    const typeStmt = db.prepare(`
      SELECT 
        w.name, p.worker_type,
        COUNT(p.id) as piece_count,
        SUM(p.fee) as total_fee
      FROM workers w
      JOIN production p ON w.name = p.worker_name 
        AND strftime('%Y-%m', p.complete_time) = ?
      GROUP BY w.name, p.worker_type
    `);
    typeStmt.bind([month]);
    const typeStats = queryResult(typeStmt);

    // 计算总计
    const totalStmt = db.prepare(`
      SELECT 
        COUNT(*) as total_pieces,
        SUM(fee) as total_salary
      FROM production 
      WHERE strftime('%Y-%m', complete_time) = ?
    `);
    totalStmt.bind([month]);
    const totalResult = queryResult(totalStmt);
    const total_pieces = totalResult[0]?.total_pieces || 0;
    const total_salary = totalResult[0]?.total_salary || 0;

    return NextResponse.json({
      stats,
      typeStats,
      total: { total_pieces, total_salary },
      month
    });
  } catch (error) {
    console.error('获取工人统计失败:', error);
    return NextResponse.json({
      stats: [],
      typeStats: [],
      total: { total_pieces: 0, total_salary: 0 },
      month: new Date().toISOString().slice(0, 7)
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { worker_id, price_per_piece, sewing_full, sewing_half, sewing_quarter, embroidery_full, embroidery_half, embroidery_tail } = body;

    // 更新工人单价
    db.run(`
      UPDATE workers SET 
        price_per_piece = ?,
        sewing_full = ?,
        sewing_half = ?,
        sewing_quarter = ?,
        embroidery_full = ?,
        embroidery_half = ?,
        embroidery_tail = ?
      WHERE id = ?
    `, [
      price_per_piece,
      sewing_full || 0,
      sewing_half || 0,
      sewing_quarter || 0,
      embroidery_full || 0,
      embroidery_half || 0,
      embroidery_tail || 0,
      worker_id
    ]);

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