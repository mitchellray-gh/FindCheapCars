declare module 'sql.js' {
  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
    WASM_BINARY?: ArrayBuffer;
  }

  interface Database {
    run(sql: string, params?: unknown[]): Database;
    exec(sql: string, params?: unknown[]): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
  }

  interface Statement {
    bind(params?: unknown[]): boolean;
    step(): boolean;
    get(params?: unknown[]): unknown[];
    getAsObject(params?: unknown): Record<string, unknown>;
    run(params?: unknown[]): void;
    free(): boolean;
    reset(): void;
  }

  interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  function initSqlJs(config?: {
    locateFile?: (filename: string) => string;
  }): Promise<SqlJsStatic>;

  export default initSqlJs;
  export type { SqlJsStatic, Database, Statement, QueryExecResult };
}
