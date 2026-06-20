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
}

// POST: 批量导入版型数据
export async function POST(request: NextRequest) {
  try {
    const body: BatchImportRequest = await request.json();
    const { patterns } = body;

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
      // 使用事务确保原子性
      const insertMany = db.transaction((patterns: PatternData[]) => {
        // 清空现有数据
        db.exec('DELETE FROM patterns');
        
        // 批量插入新数据
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

      const count = insertMany(patterns);
      
      return NextResponse.json({
        success: true,
        count: count,
        message: `成功导入 ${count} 条版型数据`
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