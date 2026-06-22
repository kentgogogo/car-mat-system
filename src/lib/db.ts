import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

// 数据库路径
const DB_PATH = path.join(process.cwd(), 'data', 'factory.db');
const DATA_DIR = path.join(process.cwd(), 'data');

// 全局数据库实例和初始化 Promise
let db: SqlJsDatabase | null = null;
let dbInitPromise: Promise<SqlJsDatabase> | null = null;

// 确保数据目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 保存数据库到文件
export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// 初始化数据库表
function initTables(database: SqlJsDatabase) {
  // 系统配置表
  database.run(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // 客户表 - 增加 logistics, is_collect, remark 字段
  database.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      logistics TEXT,
      is_collect TEXT DEFAULT '否',
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 工人工价表 - 增加车工和绣线工价配置
  database.run(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price_per_piece INTEGER DEFAULT 50,
      sewing_full INTEGER DEFAULT 0,
      sewing_half INTEGER DEFAULT 0,
      sewing_quarter INTEGER DEFAULT 0,
      embroidery_full INTEGER DEFAULT 0,
      embroidery_half INTEGER DEFAULT 0,
      embroidery_tail INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 订单表 - 增加 line_mark, set_type, embroidery_type, sewing_fee, embroidery_fee
  database.run(`
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
      line_mark TEXT,
      vin_code TEXT,
      set_type TEXT DEFAULT '全套',
      embroidery_type TEXT DEFAULT '无',
      sewing_fee INTEGER DEFAULT 0,
      embroidery_fee INTEGER DEFAULT 0,
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS production (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      production_no TEXT UNIQUE NOT NULL,
      order_no TEXT NOT NULL,
      product_info TEXT,
      quantity INTEGER,
      status TEXT DEFAULT '待生产',
      worker_name TEXT,
      worker_type TEXT DEFAULT '车工',
      fee INTEGER DEFAULT 0,
      complete_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS query_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_model TEXT NOT NULL,
      year TEXT,
      vin_code TEXT,
      product_type TEXT,
      pattern_code TEXT NOT NULL,
      guide_info TEXT,
      query_time TEXT NOT NULL,
      query_date TEXT NOT NULL
    )
  `);

  // 发货记录表（独立于订单，支持手动录入）
  database.run(`
    CREATE TABLE IF NOT EXISTS shipping_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      vehicle TEXT,
      logistics TEXT,
      tracking_no TEXT,
      is_collect TEXT DEFAULT '否',
      lower_material TEXT,
      upper_material TEXT,
      tail_mat TEXT,
      remark TEXT,
      source TEXT DEFAULT 'manual',
      order_id INTEGER,
      order_no TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 添加缺失的列（兼容已有数据库）
  const addColumnIfNotExists = (table: string, column: string, type: string) => {
    try {
      database.run(`SELECT ${column} FROM ${table} LIMIT 1`);
    } catch {
      database.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  };

  // orders 表新字段
  addColumnIfNotExists('orders', 'vin_code', 'TEXT');
  addColumnIfNotExists('orders', 'line_mark', 'TEXT');
  addColumnIfNotExists('orders', 'set_type', 'TEXT DEFAULT \'全套\'');
  addColumnIfNotExists('orders', 'embroidery_type', 'TEXT DEFAULT \'无\'');
  addColumnIfNotExists('orders', 'sewing_fee', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('orders', 'embroidery_fee', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('orders', 'tracking_no', 'TEXT');
  addColumnIfNotExists('orders', 'tail_version_no', 'TEXT'); // 后舱版型号

  // customers 表新字段
  addColumnIfNotExists('customers', 'logistics', 'TEXT');
  addColumnIfNotExists('customers', 'is_collect', 'TEXT DEFAULT \'否\'');
  addColumnIfNotExists('customers', 'remark', 'TEXT');

  // production 表新字段
  addColumnIfNotExists('production', 'worker_type', 'TEXT DEFAULT \'车工\'');
  addColumnIfNotExists('production', 'fee', 'INTEGER DEFAULT 0');

  // workers 表新字段
  addColumnIfNotExists('workers', 'sewing_full', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('workers', 'sewing_half', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('workers', 'sewing_quarter', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('workers', 'embroidery_full', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('workers', 'embroidery_half', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('workers', 'embroidery_tail', 'INTEGER DEFAULT 0');

  // 初始化默认密码
  const passwordStmt = database.prepare('SELECT value FROM config WHERE key = \'password\'');
  const passwordResult = passwordStmt.step() ? (passwordStmt as any).getAsObject() : null;
  passwordStmt.free();
  if (!passwordResult) {
    database.run('INSERT INTO config (key, value) VALUES (?, ?)', ['password', 'hc123456']);
  }

  // 初始化工人数据（3个车工）
  const workersCount = database.exec('SELECT COUNT(*) FROM workers')[0]?.values[0]?.[0] || 0;
  if (workersCount === 0) {
    // 3个车工人员，设置默认工价
    const workers = [
      { name: '黄姐', sewing_full: 16, sewing_half: 8, sewing_quarter: 4 },
      { name: '雨婷', sewing_full: 16, sewing_half: 8, sewing_quarter: 4 },
      { name: '阿霞', sewing_full: 16, sewing_half: 8, sewing_quarter: 4 }
    ];
    workers.forEach(w => {
      database.run(`
        INSERT INTO workers (name, price_per_piece, sewing_full, sewing_half, sewing_quarter, 
        embroidery_full, embroidery_half, embroidery_tail) 
        VALUES (?, 50, ?, ?, ?, 8, 4, 4)
      `, [w.name, w.sewing_full, w.sewing_half, w.sewing_quarter]);
    });
  }

  saveDatabase();
}

// 获取数据库实例（异步）
export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;
  
  if (dbInitPromise) return dbInitPromise;
  
  // 在生产环境中，WASM 文件路径可能不同，需要动态查找
  const wasmPaths = [
    path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    path.join(process.cwd(), 'node_modules', '.pnpm', 'sql.js@1.14.1', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
  ];
  
  // 尝试找到 WASM 文件
  let wasmPath = '';
  for (const p of wasmPaths) {
    if (fs.existsSync(p)) {
      wasmPath = p;
      console.log('Found WASM file at:', wasmPath);
      break;
    }
  }
  
  if (!wasmPath) {
    // 如果找不到 WASM 文件，尝试从 node_modules 目录递归查找
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      const findWasm = (dir: string): string | null => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            const found = findWasm(fullPath);
            if (found) return found;
          } else if (file === 'sql-wasm.wasm') {
            return fullPath;
          }
        }
        return null;
      };
      const found = findWasm(nodeModulesPath);
      if (found) {
        wasmPath = found;
        console.log('Found WASM file via recursive search:', wasmPath);
      }
    }
  }
  
  dbInitPromise = initSqlJs({
    locateFile: (file: string) => {
      if (file.endsWith('.wasm') && wasmPath) {
        return wasmPath;
      }
      return file;
    }
  }).then((SQL: { Database: new (data?: Uint8Array) => SqlJsDatabase }) => {
    console.log('sql.js initialized successfully');
    ensureDataDir();
    
    // 尝试加载已有数据库文件
    let database: SqlJsDatabase;
    if (fs.existsSync(DB_PATH)) {
      console.log('Loading existing database from:', DB_PATH);
      const buffer = fs.readFileSync(DB_PATH);
      database = new SQL.Database(buffer);
    } else {
      console.log('Creating new database');
      database = new SQL.Database();
    }
    
    // 初始化表结构
    initTables(database);
    
    db = database;
    console.log('Database ready');
    return database;
  }).catch((err: Error) => {
    console.error('Database initialization failed:', err);
    throw err;
  });
  
  return dbInitPromise;
}

// 同步导出（用于兼容旧代码，但会返回 null 直到初始化完成）
export { db };

// 辅助函数：执行查询并返回结果数组
export function queryResult(stmt: any): any[] {
  const results: any[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}

// 辅助函数：获取单条结果
export function queryOne(stmt: any): any | null {
  const result = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return result;
}

// 辅助函数：安全保存数据库
export function safeSave() {
  saveDatabase();
}

// 工价计算函数
export function calculateFees(
  productType: string,
  setType: string,
  embroideryType: string
): { sewingFee: number; embroideryFee: number } {
  // 车工工价表：软包全套16/半套8/四分之一套4，脚垫全套6/半套3/四分之一套2
  const sewingPrices: Record<string, Record<string, number>> = {
    '软包': { '全套': 16, '半套': 8, '四分之一套': 4 },
    '脚垫': { '全套': 6, '半套': 3, '四分之一套': 2 }
  };

  // 绣线工价表：软包全套8/半套4/尾垫4（脚垫无绣线）
  const embroideryPrices: Record<string, Record<string, number>> = {
    '软包': { '永恒': 8, '穿梭': 8, '群图': 8, '无': 0 },
    '脚垫': { '永恒': 0, '穿梭': 0, '群图': 0, '无': 0 }
  };

  // 软包绣线根据套数调整：全套8/半套4/尾垫4
  const softEmbroideryBySet: Record<string, number> = {
    '全套': 8,
    '半套': 4,
    '四分之一套': 4 // 尾垫价格
  };

  const sewingFee = sewingPrices[productType]?.[setType] || 0;
  
  let embroideryFee = 0;
  if (embroideryType !== '无') {
    if (productType === '软包') {
      embroideryFee = softEmbroideryBySet[setType] || 0;
    } else {
      embroideryFee = 0; // 脚垫无绣线
    }
  }

  return { sewingFee, embroideryFee };
}