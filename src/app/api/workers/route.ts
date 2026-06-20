import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryResult } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT id, name, price_per_piece FROM workers ORDER BY name
    `);
    const workers = queryResult(stmt);

    return NextResponse.json({ workers });
  } catch (error) {
    console.error('获取工人列表失败:', error);
    return NextResponse.json({ workers: [] });
  }
}