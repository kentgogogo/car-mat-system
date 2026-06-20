import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// 产品类型映射
const productTypeMap: Record<string, string> = {
  '脚垫': '脚垫',
  '软包': '软包',
  '后仓': '后仓',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand') || '';
    const series = searchParams.get('series') || '';
    const year = searchParams.get('year') || '';
    const type = searchParams.get('type') || '';

    // 构建查询条件
    let sql = 'SELECT * FROM patterns WHERE 1=1';
    const params: string[] = [];

    if (brand) {
      sql += ' AND brand = ?';
      params.push(brand);
    }
    if (series) {
      sql += ' AND series = ?';
      params.push(series);
    }
    if (year) {
      sql += ' AND year = ?';
      params.push(year);
    }
    if (type) {
      sql += ' AND product_type = ?';
      params.push(type);
    }

    sql += ' ORDER BY brand, series, year, product_type';

    const patterns = db.prepare(sql).all(...params) as Array<{
      id: number;
      brand: string;
      series: string;
      year: string;
      product_type: string;
      version_no: string;
      need_guide: number;
      guide_condition: string | null;
      created_at: string;
    }>;

    // 获取所有品牌列表
    const brands = db.prepare('SELECT DISTINCT brand FROM patterns ORDER BY brand').all() as Array<{ brand: string }>;
    
    // 获取所有车系列表
    const seriesList = db.prepare('SELECT DISTINCT series FROM patterns ORDER BY series').all() as Array<{ series: string }>;
    
    // 获取所有年款列表
    const years = db.prepare('SELECT DISTINCT year FROM patterns ORDER BY year DESC').all() as Array<{ year: string }>;

    return NextResponse.json({
      success: true,
      patterns: patterns.map(p => ({
        id: p.id,
        brand: p.brand,
        series: p.series,
        year: p.year,
        product_type: productTypeMap[p.product_type] || p.product_type,
        version_no: p.version_no,
        need_guide: p.need_guide === 1,
        guide_condition: p.guide_condition,
      })),
      brands: brands.map(b => b.brand),
      seriesList: seriesList.map(s => s.series),
      years: years.map(y => y.year),
    });
  } catch (error) {
    console.error('版型查询失败:', error);
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
  }
}