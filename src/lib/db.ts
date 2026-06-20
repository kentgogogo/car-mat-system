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
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// 初始化数据库表
function initTables(database: SqlJsDatabase) {
  database.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price_per_piece INTEGER DEFAULT 50,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
      vin_code TEXT,
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

  // 检查 vin_code 列是否存在，不存在则添加
  try {
    database.run('SELECT vin_code FROM orders LIMIT 1');
  } catch {
    database.run('ALTER TABLE orders ADD COLUMN vin_code TEXT');
  }

  // 初始化工人数据
  const workersCount = database.exec('SELECT COUNT(*) FROM workers')[0]?.values[0]?.[0] || 0;
  if (workersCount === 0) {
    const workers = ['张师傅', '王师傅', '李师傅', '赵师傅', '刘师傅', '陈师傅'];
    workers.forEach(name => {
      database.run('INSERT INTO workers (name, price_per_piece) VALUES (?, 50)', [name]);
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