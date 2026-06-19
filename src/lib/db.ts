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

  -- 创建索引
  CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
  CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_name);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_production_order ON production(order_no);
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

export default db;