import { NextRequest, NextResponse } from 'next/server';
import { getDb, safeSave, queryOne } from '@/lib/db';

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
        const { name, phone, logistics, is_collect, remark } = customer;
        
        if (!name || typeof name !== 'string' || name.trim() === '') {
          results.skipped++;
          results.errors.push(`客户名称为空，已跳过`);
          continue;
        }

        const trimmedName = name.trim();
        const trimmedPhone = phone ? String(phone).trim() : null;
        const trimmedLogistics = logistics ? String(logistics).trim() : null;
        const trimmedIsCollect = is_collect ? String(is_collect).trim() : '否';
        const trimmedRemark = remark ? String(remark).trim() : null;

        // 检查客户是否已存在
        const stmt = db.prepare('SELECT * FROM customers WHERE name = ?');
        stmt.bind([trimmedName]);
        const existing = queryOne(stmt) as { id: number; phone: string | null; logistics: string | null; is_collect: string | null; remark: string | null } | null;

        if (existing) {
          // 更新客户信息（如果有新信息）
          const updateFields: string[] = [];
          const updateValues: (string | null)[] = [];
          
          if (trimmedPhone && existing.phone !== trimmedPhone) {
            updateFields.push('phone = ?');
            updateValues.push(trimmedPhone);
          }
          if (trimmedLogistics && existing.logistics !== trimmedLogistics) {
            updateFields.push('logistics = ?');
            updateValues.push(trimmedLogistics);
          }
          if (trimmedIsCollect && existing.is_collect !== trimmedIsCollect) {
            updateFields.push('is_collect = ?');
            updateValues.push(trimmedIsCollect);
          }
          if (trimmedRemark && existing.remark !== trimmedRemark) {
            updateFields.push('remark = ?');
            updateValues.push(trimmedRemark);
          }

          if (updateFields.length > 0) {
            db.run(`UPDATE customers SET ${updateFields.join(', ')} WHERE name = ?`, [...updateValues, trimmedName]);
            results.updated++;
          } else {
            results.skipped++;
          }
        } else {
          // 新增客户
          db.run(`INSERT INTO customers (name, phone, logistics, is_collect, remark) VALUES (?, ?, ?, ?, ?)`, [trimmedName, trimmedPhone, trimmedLogistics, trimmedIsCollect, trimmedRemark]);
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