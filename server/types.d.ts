declare module 'sql.js' {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }
  
  interface Database {
    run(sql: string, params?: any[]): Database;
    exec(sql: string, params?: any[]): QueryExecResult[];
    close(): void;
  }
  
  interface QueryExecResult {
    columns: string[];
    values: any[][];
  }
  
  export function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
  
  // For named import { Database }
  export { Database };
}

declare module 'better-sqlite3' {
  namespace Database {
    interface Statement {
      run(...params: any[]): RunResult;
      get(...params: any[]): any;
      all(...params: any[]): any[];
      iterate(...params: any[]): IterableIterator<any>;
    }
    
    interface RunResult {
      changes: number;
      lastInsertRowid: number | bigint;
    }
  }
  
  interface Database {
    prepare(sql: string): Database.Statement;
    exec(sql: string): this;
    close(): void;
    pragma(pragma: string): any;
  }
  
  interface DatabaseConstructor {
    new (filename: string, options?: { readonly?: boolean; fileMustExist?: boolean }): Database;
    (filename: string, options?: { readonly?: boolean; fileMustExist?: boolean }): Database;
  }
  
  const Database: DatabaseConstructor;
  export = Database;
}
