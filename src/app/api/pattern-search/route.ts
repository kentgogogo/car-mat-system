import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// 产品类型映射
const productTypeMap: Record<string, string> = {
  '脚垫': '脚垫',
  '软包': '软包',
  '后仓': '后仓',
};

// 解析年款范围，返回开始和结束年份
function parseYearRange(yearStr: string): { start: number; end: number } | null {
  // 清理空格
  const cleaned = yearStr.trim();
  
  // 尝试匹配范围格式：'2014-2017' 或 '2011~2016' 或 '2014~2017'
  const rangeMatch = cleaned.match(/^(\d{4})[-~](\d{4})$/);
  if (rangeMatch) {
    return {
      start: parseInt(rangeMatch[1], 10),
      end: parseInt(rangeMatch[2], 10),
    };
  }
  
  // 尝试匹配单个年份：'2022'
  const singleMatch = cleaned.match(/^(\d{4})$/);
  if (singleMatch) {
    const year = parseInt(singleMatch[1], 10);
    return { start: year, end: year };
  }
  
  // 无法解析，返回null（不参与过滤）
  return null;
}

// 判断用户输入的年份是否在数据库年款范围内
function isYearInRange(userYear: string, dbYearStr: string): boolean {
  const userYearNum = parseInt(userYear, 10);
  if (isNaN(userYearNum)) return false;
  
  const dbRange = parseYearRange(dbYearStr);
  if (!dbRange) return false; // 无法解析的年款不参与匹配
  
  return userYearNum >= dbRange.start && userYearNum <= dbRange.end;
}

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

    // 有筛选条件时，先查询基础数据（不包含年款过滤）
    let sql = 'SELECT * FROM patterns WHERE 1=1';
    const params: string[] = [];

    // 品牌模糊匹配：输入"宝马"能匹配到brand="宝马"，输入"问"能匹配到"问界"
    if (brand) {
      sql += ' AND brand LIKE ?';
      params.push(`%${brand}%`);
    }

    // 车系模糊匹配：输入"5系"能匹配到series="宝马5系"或"5系"
    if (series) {
      sql += ' AND series LIKE ?';
      params.push(`%${series}%`);
    }

    // 产品类型精确匹配
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

    // 应用层过滤：年款范围匹配
    let filteredPatterns = patterns;
    if (year) {
      filteredPatterns = patterns.filter(p => isYearInRange(year, p.year));
    }

    // 去重：相同 version_no 只保留第一条
    const seenVersionNos = new Set<string>();
    const deduplicatedPatterns = filteredPatterns.filter(p => {
      if (seenVersionNos.has(p.version_no)) {
        return false;
      }
      seenVersionNos.add(p.version_no);
      return true;
    });

    // 限制返回数量
    const limitedPatterns = deduplicatedPatterns.slice(0, 1000);

    return NextResponse.json({
      success: true,
      patterns: limitedPatterns.map(p => ({
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
      total: limitedPatterns.length,
      filtered_from: patterns.length, // 原始查询数量（用于调试）
    });
  } catch (error) {
    console.error('版型查询失败:', error);
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
  }
}