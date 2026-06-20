import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface PatternData {
  brand: string;
  series: string;
  year: string;
  product_type: string;
  version_no: string;
  need_guide: boolean;
  guide_condition?: string | null;
}

interface BatchImportRequest {
  patterns: PatternData[];
  clear_existing?: boolean; // 是否清空现有数据，默认 false（追加模式）
}

// POST: 批量导入版型数据
export async function POST(request: NextRequest) {
  try {
    const body: BatchImportRequest = await request.json();
    const { patterns, clear_existing = false } = body;

    if (!patterns || !Array.isArray(patterns) || patterns.length === 0) {
      return NextResponse.json(
        { success: false, error: '无效的数据格式或数据为空' },
        { status: 400 }
      );
    }

    // 数据验证
    for (const pattern of patterns) {
      if (!pattern.brand || !pattern.series || !pattern.year || 
          !pattern.product_type || !pattern.version_no) {
        return NextResponse.json(
          { success: false, error: '数据不完整，每条记录必须包含品牌、车系、年款、产品类型、版型号' },
          { status: 400 }
        );
      }
    }

    try {
      // 获取当前数据总量
      const currentCount = db.prepare('SELECT COUNT(*) as count FROM patterns').get() as { count: number };
      
      // 使用事务确保原子性
      const insertMany = db.transaction((patterns: PatternData[], clear: boolean) => {
        // 仅当 clear_existing=true 时才清空现有数据
        if (clear) {
          db.exec('DELETE FROM patterns');
        }
        
        // 批量插入新数据（追加模式）
        const insertStmt = db.prepare(`
          INSERT INTO patterns (brand, series, year, product_type, version_no, need_guide, guide_condition)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const pattern of patterns) {
          insertStmt.run(
            pattern.brand,
            pattern.series,
            pattern.year,
            pattern.product_type,
            pattern.version_no,
            pattern.need_guide ? 1 : 0,
            pattern.guide_condition || null
          );
        }
        
        return patterns.length;
      });

      const insertedCount = insertMany(patterns, clear_existing);
      
      // 获取导入后的数据总量
      const newCount = db.prepare('SELECT COUNT(*) as count FROM patterns').get() as { count: number };
      
      return NextResponse.json({
        success: true,
        count: insertedCount,
        previous_count: currentCount.count,
        total_count: newCount.count,
        mode: clear_existing ? '覆盖' : '追加',
        message: clear_existing 
          ? `已清空原有数据，成功导入 ${insertedCount} 条版型数据，当前共 ${newCount.count} 条`
          : `追加成功，新增 ${insertedCount} 条版型数据，当前共 ${newCount.count} 条`
      });
    } catch (dbError) {
      console.error('数据库操作失败:', dbError);
      return NextResponse.json(
        { success: false, error: '数据库操作失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('批量导入失败:', error);
    return NextResponse.json(
      { success: false, error: '批量导入失败，请检查数据格式' },
      { status: 500 }
    );
  }
}