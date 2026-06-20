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

    // 判断是否有筛选条件
    const hasFilter = brand || series || year || type;

    // 获取全量品牌、车系、年款列表（用于下拉框填充）
    const brands = db.prepare('SELECT DISTINCT brand FROM patterns ORDER BY brand').all() as Array<{ brand: string }>;
    const seriesList = db.prepare('SELECT DISTINCT series FROM patterns ORDER BY series').all() as Array<{ series: string }>;
    const years = db.prepare('SELECT DISTINCT year FROM patterns ORDER BY year DESC').all() as Array<{ year: string }>;

    // 如果没有任何筛选条件，返回空数组（只返回下拉框选项）
    if (!hasFilter) {
      return NextResponse.json({
        success: true,
        patterns: [],
        brands: brands.map(b => b.brand),
        seriesList: seriesList.map(s => s.series),
        years: years.map(y => y.year),
      });
    }

    // 有筛选条件时，构建查询并返回匹配结果
    let sql = 'SELECT * FROM patterns WHERE 1=1';
    const params: string[] = [];

    // 品牌模糊匹配：输入"问"能匹配到"问界"
    if (brand) {
      sql += ' AND brand LIKE ?';
      params.push(`%${brand}%`);
    }

    // 车系模糊匹配：输入"问界"能匹配到"问界M6"
    if (series) {
      sql += ' AND series LIKE ?';
      params.push(`%${series}%`);
    }

    // 年款精确匹配
    if (year) {
      sql += ' AND year = ?';
      params.push(year);
    }

    // 产品类型精确匹配
    if (type) {
      sql += ' AND product_type = ?';
      params.push(type);
    }

    sql += ' ORDER BY brand, series, year, product_type LIMIT 1000';

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
      total: patterns.length,
    });
  } catch (error) {
    console.error('版型查询失败:', error);
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
  }
}