import { NextRequest, NextResponse } from 'next/server';
import { getDb, safeSave, queryOne } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { password } = body;

    // 获取系统密码
    const stmt = db.prepare('SELECT value FROM config WHERE key = \'password\'');
    const result = queryOne(stmt) as { value: string } | null;
    
    const systemPassword = result?.value || 'hc123456';

    if (password === systemPassword) {
      return NextResponse.json({
        success: true,
        message: '验证成功'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '密码错误'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('验证密码失败:', error);
    return NextResponse.json({
      success: false,
      message: '验证失败'
    }, { status: 500 });
  }
}

// 获取/修改密码配置
export async function GET() {
  try {
    const db = await getDb();
    const stmt = db.prepare('SELECT value FROM config WHERE key = \'password\'');
    const result = queryOne(stmt) as { value: string } | null;
    
    return NextResponse.json({
      password: result?.value || 'hc123456'
    });
  } catch (error) {
    console.error('获取密码配置失败:', error);
    return NextResponse.json({
      password: 'hc123456'
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { password } = body;

    if (!password || password.length < 6) {
      return NextResponse.json({
        success: false,
        message: '密码长度至少6位'
      }, { status: 400 });
    }

    db.run('UPDATE config SET value = ? WHERE key = \'password\'', [password]);
    safeSave();

    return NextResponse.json({
      success: true,
      message: '密码已更新'
    });
  } catch (error) {
    console.error('更新密码失败:', error);
    return NextResponse.json({
      success: false,
      message: '更新失败'
    }, { status: 500 });
  }
}