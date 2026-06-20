import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryResult, safeSave } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT id, name, price_per_piece, 
        sewing_full, sewing_half, sewing_quarter,
        embroidery_full, embroidery_half, embroidery_tail
      FROM workers ORDER BY name
    `);
    const workers = queryResult(stmt);

    return NextResponse.json({ workers });
  } catch (error) {
    console.error('获取工人列表失败:', error);
    return NextResponse.json({ workers: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { name, sewing_full, sewing_half, sewing_quarter, embroidery_full, embroidery_half, embroidery_tail } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: '工人姓名不能为空' }, { status: 400 });
    }

    // 检查是否已存在
    const checkStmt = db.prepare('SELECT id FROM workers WHERE name = ?');
    checkStmt.bind([name]);
    const existing = queryResult(checkStmt);
    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: '工人已存在' }, { status: 400 });
    }

    // 插入新工人
    db.run(`
      INSERT INTO workers (name, price_per_piece, sewing_full, sewing_half, sewing_quarter,
      embroidery_full, embroidery_half, embroidery_tail)
      VALUES (?, 50, ?, ?, ?, ?, ?, ?)
    `, [name, sewing_full || 16, sewing_half || 8, sewing_quarter || 4, 
        embroidery_full || 8, embroidery_half || 4, embroidery_tail || 4]);

    safeSave();

    return NextResponse.json({ success: true, message: '工人已添加' });
  } catch (error) {
    console.error('添加工人失败:', error);
    return NextResponse.json({ success: false, error: '添加失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少工人ID' }, { status: 400 });
    }

    db.run('DELETE FROM workers WHERE id = ?', [parseInt(id)]);
    safeSave();

    return NextResponse.json({ success: true, message: '工人已删除' });
  } catch (error) {
    console.error('删除工人失败:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}