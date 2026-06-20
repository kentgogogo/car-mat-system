import { NextRequest, NextResponse } from 'next/server';
import { getDb, safeSave } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    
    // 清除所有旧工人
    db.run('DELETE FROM workers');
    
    // 添加3个预设车工
    const workers = [
      { name: '黄姐', sewing_full: 16, sewing_half: 8, sewing_quarter: 4 },
      { name: '雨婷', sewing_full: 16, sewing_half: 8, sewing_quarter: 4 },
      { name: '阿霞', sewing_full: 16, sewing_half: 8, sewing_quarter: 4 }
    ];
    
    workers.forEach(w => {
      db.run(`
        INSERT INTO workers (name, price_per_piece, sewing_full, sewing_half, sewing_quarter,
        embroidery_full, embroidery_half, embroidery_tail)
        VALUES (?, 50, ?, ?, ?, 8, 4, 4)
      `, [w.name, w.sewing_full, w.sewing_half, w.sewing_quarter]);
    });
    
    safeSave();
    
    return NextResponse.json({ 
      success: true, 
      message: '已重置为3个预设车工：黄姐、雨婷、阿霞',
      workers: workers.map(w => w.name)
    });
  } catch (error) {
    console.error('重置工人失败:', error);
    return NextResponse.json({ success: false, error: '重置失败' }, { status: 500 });
  }
}