import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 数据库路径
const DB_PATH = path.join(process.cwd(), 'data', 'factory.db');
const DATA_DIR = path.join(process.cwd(), 'data');

// 确保 data 目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 创建数据库连接（同步）
const db = new Database(DB_PATH);

// 启用 WAL 模式，提高性能
db.pragma('journal_mode = WAL');

// 初始化数据库表
function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price_per_piece INTEGER DEFAULT 50,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      customer_name TEXT,
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
      unit_price INTEGER,
      total_price INTEGER,
      payment_status TEXT DEFAULT '未付',
      remark TEXT,
      status TEXT DEFAULT '待裁剪',
      vin_code TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS production (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      production_no TEXT UNIQUE NOT NULL,
      order_no TEXT NOT NULL,
      product_info TEXT,
      quantity INTEGER,
      status TEXT DEFAULT '待生产',
      worker_name TEXT,
      complete_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS query_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_model TEXT NOT NULL,
      year TEXT NOT NULL,
      vin_code TEXT,
      product_type TEXT NOT NULL,
      pattern_code TEXT NOT NULL,
      guide_info TEXT,
      query_time TEXT DEFAULT CURRENT_TIMESTAMP,
      query_date TEXT NOT NULL
    )
  `);
  
  // 初始化工人数据
  const workersCount = db.prepare('SELECT COUNT(*) as count FROM workers').get() as { count: number };
  if (workersCount.count === 0) {
    const workers = ['张师傅', '王师傅', '李师傅', '赵师傅', '刘师傅', '陈师傅'];
    const insertWorker = db.prepare('INSERT INTO workers (name, price_per_piece) VALUES (?, ?)');
    workers.forEach(name => {
      insertWorker.run(name, 50);
    });
  }
}

// 初始化表
initTables();

// 导出数据库实例
export { db };