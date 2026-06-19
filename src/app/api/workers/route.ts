import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const workers = db.prepare(`
      SELECT id, name, price_per_piece FROM workers ORDER BY name
    `).all();
    
    return NextResponse.json({ workers });
  } catch (error) {
    console.error('获取工人列表失败:', error);
    return NextResponse.json({ error: '获取工人列表失败' }, { status: 500 });
  }
}