import { NextRequest, NextResponse } from 'next/server';
import { getDb, safeSave } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { customers } = body;

    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json({
        success: false,
        error: '请提供客户数据数组'
      }, { status: 400 });
    }

    const results = {
      total: customers.length,
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const customer of customers) {
      try {
        const { name, phone } = customer;
        
        if (!name || typeof name !== 'string' || name.trim() === '') {
          results.skipped++;
          results.errors.push(`客户名称为空，已跳过`);
          continue;
        }

        const trimmedName = name.trim();
        const trimmedPhone = phone ? String(phone).trim() : null;

        // 检查客户是否已存在
        const stmt = db.prepare(`
          SELECT * FROM customers WHERE name = ?
        `);
        stmt.bind([trimmedName]);
        const existing = stmt.get() as unknown as { id: number; phone: string | null } | undefined;

        if (existing) {
          // 如果提供了电话且与现有不同，则更新
          if (trimmedPhone && existing.phone !== trimmedPhone) {
            db.run(`
              UPDATE customers SET phone = ? WHERE name = ?
            `, [trimmedPhone, trimmedName]);
            results.updated++;
          } else {
            results.skipped++;
          }
        } else {
          // 新增客户
          db.run(`
            INSERT INTO customers (name, phone)
            VALUES (?, ?)
          `, [trimmedName, trimmedPhone]);
          results.added++;
        }
      } catch (err) {
        results.errors.push(`处理客户 "${customer.name}" 时出错: ${err}`);
      }
    }

    safeSave();

    return NextResponse.json({
      success: true,
      message: `导入完成：新增 ${results.added} 个，更新 ${results.updated} 个，跳过 ${results.skipped} 个`,
      results
    });
  } catch (error) {
    console.error('批量导入客户失败:', error);
    return NextResponse.json({
      success: false,
      error: '批量导入客户失败'
    }, { status: 500 });
  }
}