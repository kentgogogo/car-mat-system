import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'factory.db');

// 确保数据目录存在
import fs from 'fs';
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// 初始化数据库表
db.exec(`
  -- 客户表
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 工人表
  CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    price_per_piece REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 订单表
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT NOT NULL UNIQUE,
    date TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    logistics TEXT,
    brand TEXT,
    model TEXT,
    year_style TEXT,
    product_type TEXT,
    version_no TEXT,
    lower_material TEXT,
    upper_material TEXT,
    craft TEXT,
    auxiliary TEXT,
    tail_mat TEXT,
    color TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price REAL,
    total_price REAL,
    payment_status TEXT DEFAULT '未付',
    remark TEXT,
    status TEXT DEFAULT '待裁剪',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 生产表
  CREATE TABLE IF NOT EXISTS production (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    production_no TEXT NOT NULL UNIQUE,
    order_no TEXT NOT NULL,
    product_info TEXT,
    quantity INTEGER,
    status TEXT DEFAULT '待生产',
    worker_name TEXT,
    complete_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_no) REFERENCES orders(order_no)
  );

  -- 版型表
  CREATE TABLE IF NOT EXISTS patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    series TEXT NOT NULL,
    year TEXT NOT NULL,
    product_type TEXT NOT NULL,
    version_no TEXT NOT NULL,
    need_guide INTEGER DEFAULT 0,
    guide_condition TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 查询记录表
  CREATE TABLE IF NOT EXISTS query_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_model TEXT NOT NULL,
    year TEXT NOT NULL,
    product_type TEXT NOT NULL,
    pattern_code TEXT NOT NULL,
    guide_info TEXT,
    query_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    query_date TEXT NOT NULL
  );

  -- 创建索引
  CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
  CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_name);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_version_no ON orders(version_no);
  CREATE INDEX IF NOT EXISTS idx_production_order ON production(order_no);
  CREATE INDEX IF NOT EXISTS idx_patterns_brand ON patterns(brand);
  CREATE INDEX IF NOT EXISTS idx_patterns_series ON patterns(series);
  CREATE INDEX IF NOT EXISTS idx_patterns_year ON patterns(year);
  CREATE INDEX IF NOT EXISTS idx_query_logs_date ON query_logs(query_date);
  CREATE INDEX IF NOT EXISTS idx_query_logs_pattern_code ON query_logs(pattern_code);
`);

// 初始化工人数据
const workerCount = db.prepare('SELECT COUNT(*) as count FROM workers').get() as { count: number };
if (workerCount.count === 0) {
  const workers = ['张师傅', '王师傅', '李师傅', '赵师傅', '刘师傅', '陈师傅'];
  const insertWorker = db.prepare('INSERT INTO workers (name, price_per_piece) VALUES (?, ?)');
  for (const worker of workers) {
    insertWorker.run(worker, 50);
  }
}

// 初始化版型数据
const patternCount = db.prepare('SELECT COUNT(*) as count FROM patterns').get() as { count: number };
if (patternCount.count === 0) {
  const patterns = [
    { brand: '宝马', series: '5系', year: '2022', product_type: '脚垫', version_no: 'BM-5-22-A', need_guide: 0, guide_condition: null },
    { brand: '宝马', series: '5系', year: '2023', product_type: '脚垫', version_no: 'BM-5-23-A', need_guide: 1, guide_condition: '高配版需确认座椅调节方式' },
    { brand: '宝马', series: '5系', year: '2024', product_type: '脚垫', version_no: 'BM-5-24-A', need_guide: 0, guide_condition: null },
    { brand: '宝马', series: 'X5', year: '2022', product_type: '脚垫', version_no: 'BM-X5-22-A', need_guide: 0, guide_condition: null },
    { brand: '宝马', series: 'X5', year: '2023', product_type: '软包', version_no: 'BM-X5-23-SB', need_guide: 1, guide_condition: '需确认是否有第三排座椅' },
    { brand: '奔驰', series: 'E300L', year: '2022', product_type: '脚垫', version_no: 'BZ-E300-22-A', need_guide: 0, guide_condition: null },
    { brand: '奔驰', series: 'E300L', year: '2023', product_type: '脚垫', version_no: 'BZ-E300-23-A', need_guide: 1, guide_condition: '需确认是否带后排娱乐系统' },
    { brand: '奔驰', series: 'GLC', year: '2023', product_type: '软包', version_no: 'BZ-GLC-23-SB', need_guide: 0, guide_condition: null },
    { brand: '本田', series: '雅阁', year: '2016', product_type: '脚垫', version_no: 'HD-YG-16-A', need_guide: 0, guide_condition: null },
    { brand: '本田', series: '雅阁', year: '2018', product_type: '脚垫', version_no: 'HD-YG-18-A', need_guide: 0, guide_condition: null },
    { brand: '本田', series: '雅阁', year: '2022', product_type: '脚垫', version_no: 'HD-YG-22-A', need_guide: 1, guide_condition: '混动版与燃油版版型不同' },
    { brand: '本田', series: '雅阁', year: '2025', product_type: '脚垫', version_no: 'HD-YG-25-A', need_guide: 0, guide_condition: null },
    { brand: '本田', series: 'CR-V', year: '2023', product_type: '脚垫', version_no: 'HD-CRV-23-A', need_guide: 0, guide_condition: null },
    { brand: '丰田', series: '凯美瑞', year: '2018', product_type: '脚垫', version_no: 'FT-KMR-18-A', need_guide: 0, guide_condition: null },
    { brand: '丰田', series: '凯美瑞', year: '2022', product_type: '脚垫', version_no: 'FT-KMR-22-A', need_guide: 1, guide_condition: '混动版需确认电池位置' },
    { brand: '丰田', series: '凯美瑞', year: '2025', product_type: '脚垫', version_no: 'FT-KMR-25-A', need_guide: 0, guide_condition: null },
    { brand: '丰田', series: '汉兰达', year: '2022', product_type: '脚垫', version_no: 'FT-HLD-22-A', need_guide: 1, guide_condition: '需确认是否为双擎版' },
    { brand: '丰田', series: '汉兰达', year: '2023', product_type: '软包', version_no: 'FT-HLD-23-SB', need_guide: 0, guide_condition: null },
    { brand: '五菱', series: '缤果', year: '2023', product_type: '脚垫', version_no: 'WL-BG-23-A', need_guide: 0, guide_condition: null },
    { brand: '五菱', series: '缤果', year: '2024', product_type: '脚垫', version_no: 'WL-BG-24-A', need_guide: 0, guide_condition: null },
    { brand: '五菱', series: '星辰', year: '2023', product_type: '脚垫', version_no: 'WL-XC-23-A', need_guide: 0, guide_condition: null },
    { brand: '赛力斯', series: '问界M5', year: '2023', product_type: '脚垫', version_no: 'SL-M5-23-A', need_guide: 0, guide_condition: null },
    { brand: '赛力斯', series: '问界M6', year: '2024', product_type: '脚垫', version_no: 'SL-M6-24-A', need_guide: 1, guide_condition: '需确认是否带座椅通风' },
    { brand: '赛力斯', series: '问界M7', year: '2024', product_type: '软包', version_no: 'SL-M7-24-SB', need_guide: 0, guide_condition: null },
    { brand: '赛力斯', series: '问界M7', year: '2025', product_type: '后仓', version_no: 'SL-M7-25-HC', need_guide: 1, guide_condition: '需确认后备箱配置' },
    { brand: '比亚迪', series: '汉', year: '2023', product_type: '脚垫', version_no: 'BD-H-23-A', need_guide: 0, guide_condition: null },
    { brand: '比亚迪', series: '汉', year: '2024', product_type: '软包', version_no: 'BD-H-24-SB', need_guide: 1, guide_condition: 'EV版与DM版版型不同' },
    { brand: '比亚迪', series: '唐', year: '2023', product_type: '脚垫', version_no: 'BD-T-23-A', need_guide: 0, guide_condition: null },
    { brand: '比亚迪', series: '宋PLUS', year: '2024', product_type: '脚垫', version_no: 'BD-SPL-24-A', need_guide: 0, guide_condition: null },
  ];
  const insertPattern = db.prepare('INSERT INTO patterns (brand, series, year, product_type, version_no, need_guide, guide_condition) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const pattern of patterns) {
    insertPattern.run(pattern.brand, pattern.series, pattern.year, pattern.product_type, pattern.version_no, pattern.need_guide, pattern.guide_condition);
  }
}

export default db;