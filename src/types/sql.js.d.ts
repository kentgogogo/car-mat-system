declare module 'sql.js' {
  interface Database {
    run(sql: string, params?: any[]): void;
    exec(sql: string): QueryExecResult[];
    prepare(sql: string): Statement;
    close(): void;
    export(): Uint8Array;
  }

  interface Statement {
    bind(params: any[]): boolean;
    step(): boolean;
    get(): any[] | null;
    getColumnNames(): string[];
    reset(): boolean;
    free(): boolean;
    run(params?: any[]): void;
  }

  interface QueryExecResult {
    columns: string[];
    values: any[][];
  }

  interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<{
    Database: new (data?: Uint8Array) => Database;
  }>;

  export interface DatabaseConstructor {
    new (data?: Uint8Array): Database;
  }
}