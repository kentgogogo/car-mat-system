'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, FileSearch, Home, Plus, List, Factory, MoreHorizontal, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';

interface Pattern {
  id: number;
  brand: string;
  series: string;
  year: string;
  product_type: string;
  version_no: string;
  need_guide: boolean;
  guide_condition: string | null;
}

interface FilterData {
  brands: string[];
  seriesList: string[];
  years: string[];
}

export default function PatternSearchPage() {
  const [filterData, setFilterData] = useState<FilterData>({
    brands: [],
    seriesList: [],
    years: [],
  });

  const [filters, setFilters] = useState({
    brand: '',
    series: '',
    year: '',
    type: '',
  });

  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // 导入相关状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化获取筛选数据
  useEffect(() => {
    fetchFilterData();
  }, []);

  const fetchFilterData = async () => {
    try {
      const res = await fetch('/api/pattern-search');
      const data = await res.json();
      if (data.success) {
        setFilterData({
          brands: data.brands,
          seriesList: data.seriesList,
          years: data.years,
        });
      }
    } catch (error) {
      console.error('获取筛选数据失败:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.series) params.append('series', filters.series);
      if (filters.year) params.append('year', filters.year);
      if (filters.type) params.append('type', filters.type);

      const res = await fetch(`/api/pattern-search?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPatterns(data.patterns);
      }
    } catch (error) {
      console.error('查询失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      brand: '',
      series: '',
      year: '',
      type: '',
    });
    setPatterns([]);
    setSearched(false);
  };

  // 处理文件导入
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.name.endsWith('.json')) {
      setImportResult({ success: false, message: '请上传JSON格式的文件' });
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // 验证数据格式
      if (!data.patterns || !Array.isArray(data.patterns)) {
        setImportResult({ success: false, message: 'JSON格式错误，需要包含patterns数组' });
        setImporting(false);
        return;
      }

      // 调用导入API
      const res = await fetch('/api/pattern-batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patterns: data.patterns }),
      });

      const result = await res.json();
      
      if (result.success) {
        setImportResult({ 
          success: true, 
          message: result.message || `成功导入 ${result.count} 条数据`,
          count: result.count 
        });
        // 刷新筛选数据
        fetchFilterData();
        // 清空查询结果
        setPatterns([]);
        setSearched(false);
      } else {
        setImportResult({ success: false, message: result.error || '导入失败' });
      }
    } catch (error) {
      console.error('导入失败:', error);
      setImportResult({ success: false, message: '文件解析失败，请检查JSON格式' });
    } finally {
      setImporting(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-50 bg-blue-600 text-white px-4 py-3 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <FileSearch className="w-5 h-5" />
            版型查询
          </h1>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 rounded-lg text-sm hover:bg-blue-400 transition"
          >
            <Upload className="w-4 h-4" />
            导入数据
          </button>
        </div>
      </div>

      {/* 搜索区域 */}
      <div className="bg-white p-4 shadow-sm mb-4">
        <div className="space-y-3">
          {/* 品牌 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
            <select
              value={filters.brand}
              onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部品牌</option>
              {filterData.brands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* 系 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">车系</label>
            <select
              value={filters.series}
              onChange={(e) => setFilters({ ...filters, series: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部车系</option>
              {filterData.seriesList.map((series) => (
                <option key={series} value={series}>{series}</option>
              ))}
            </select>
          </div>

          {/* 年款 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">年款</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部年款</option>
              {filterData.years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* 产品类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产品类型</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部类型</option>
              <option value="脚垫">脚垫</option>
              <option value="软包">软包</option>
              <option value="后仓">后仓</option>
            </select>
          </div>

          {/* 查询按钮 */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              {loading ? '查询中...' : '查询'}
            </button>
            <button
              onClick={clearFilters}
              className="bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-300"
            >
              清空
            </button>
          </div>
        </div>
      </div>

      {/* 结果展示区域 */}
      {searched && (
        <div className="px-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">查询中...</div>
          ) : patterns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">未找到匹配的版型数据</div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-2">
                共找到 <span className="font-semibold text-blue-600">{patterns.length}</span> 条版型数据
              </div>

              {/* 结果列表 */}
              {patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="bg-white rounded-lg shadow-sm p-4 border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {pattern.version_no}
                      {pattern.need_guide && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          需确认
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{pattern.product_type}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                    <div>
                      <span className="text-gray-500">品牌：</span>
                      <span className="text-gray-900">{pattern.brand}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">车系：</span>
                      <span className="text-gray-900">{pattern.series}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">年款：</span>
                      <span className="text-gray-900">{pattern.year}</span>
                    </div>
                  </div>

                  {pattern.need_guide && pattern.guide_condition && (
                    <div className="mt-2 p-2 bg-orange-50 rounded text-sm text-orange-700">
                      <span className="font-medium">区分条件：</span>{pattern.guide_condition}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 导入弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-[90%] max-w-md p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">导入版型数据</h2>
              <button onClick={closeImportModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 说明 */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <p className="mb-2 font-medium">JSON文件格式要求：</p>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`{
  "patterns": [
    {
      "brand": "宝马",
      "series": "5系",
      "year": "2016",
      "product_type": "软包",
      "version_no": "BM1127R",
      "need_guide": true,
      "guide_condition": "滑轨36cm"
    }
  ]
}`}
                </pre>
              </div>

              {/* 上传区域 */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {importing ? '正在导入...' : '点击选择JSON文件'}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={importing}
                />
              </div>

              {/* 导入结果 */}
              {importResult && (
                <div className={`rounded-lg p-3 flex items-center gap-2 ${importResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {importResult.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="text-sm">{importResult.message}</span>
                </div>
              )}

              {/* 警告提示 */}
              <div className="bg-yellow-50 rounded-lg p-3 flex items-start gap-2 text-yellow-700">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">注意：</p>
                  <p>导入将清空现有版型数据，请确保数据正确后再导入。</p>
                </div>
              </div>

              {/* 关闭按钮 */}
              <button
                onClick={closeImportModal}
                disabled={importing}
                className="w-full bg-gray-100 text-gray-700 rounded-lg py-2 font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">首页</span>
          </Link>
          <Link href="/order/new" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <Plus className="w-5 h-5" />
            <span className="text-xs mt-1">下单</span>
          </Link>
          <Link href="/order/list" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <List className="w-5 h-5" />
            <span className="text-xs mt-1">订单</span>
          </Link>
          <Link href="/production" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <Factory className="w-5 h-5" />
            <span className="text-xs mt-1">生产</span>
          </Link>
          <Link href="/pattern-search" className="flex flex-col items-center px-3 py-1 text-blue-600">
            <FileSearch className="w-5 h-5" />
            <span className="text-xs mt-1">版型</span>
          </Link>
          <Link href="/more" className="flex flex-col items-center px-3 py-1 text-gray-500">
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-xs mt-1">更多</span>
          </Link>
        </div>
      </div>
    </div>
  );
}