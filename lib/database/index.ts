import { Knex } from 'knex';
import chalk from 'chalk';

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

interface PoolStats {
  total: number;
  available: number;
  used: number;
  pending: number;
  max: number;
  min: number;
  acquireTimeout: number;
  idleTimeout: number;
}

class Database {
  private static instance: Database;
  private knexInstance: Knex | null = null;
  private connectionAttempts = 0;
  private maxRetries = 5;
  private retryDelay = 2000;
  private isReconnecting = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  private poolConfig = {
    min: 2,
    max: 20,
    acquireTimeoutMillis: 60000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
  };

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private getConfig(): Knex.Config {
    const config: DbConfig = {
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
    };

    return {
      client: 'mysql2',
      connection: {
        ...config,
        connectTimeout: 30000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        supportBigNumbers: true,
        bigNumberStrings: true,
        dateStrings: true,
        ...(process.env.DB_SSL === 'true' && {
          ssl: { rejectUnauthorized: false },
        }),
      },
      pool: this.poolConfig,
      debug: false,
    };
  }

  async connect(): Promise<Knex> {
    if (this.knexInstance) {
      try {
        await this.knexInstance.raw('SELECT 1');
        return this.knexInstance;
      } catch {
        this.knexInstance = null;
      }
    }

    if (this.isReconnecting) {
      return new Promise((resolve, reject) => {
        const check = setInterval(() => {
          if (this.knexInstance && !this.isReconnecting) {
            clearInterval(check);
            resolve(this.knexInstance!);
          }
        }, 100);

        setTimeout(() => {
          clearInterval(check);
          reject(new Error('Connection timeout during reconnection'));
        }, 60000);
      });
    }

    this.isReconnecting = true;

    try {
      const knex = (await import('knex')).default;
      const newConnection = knex(this.getConfig());

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection initialization timeout'));
        }, 30000);

        newConnection.raw('SELECT 1').then(() => {
          clearTimeout(timeout);
          resolve();
        }).catch((err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      this.knexInstance = newConnection;
      this.connectionAttempts = 0;
      this.isReconnecting = false;

      console.log(chalk.green('✓') + chalk.gray(' Database connected successfully'));
      console.log(chalk.gray('  Host: ') + chalk.cyan(process.env.DB_HOST));
      console.log(chalk.gray('  Database: ') + chalk.cyan(process.env.DB_NAME));
      console.log(chalk.gray('  Pool: ') + chalk.yellow(`${this.poolConfig.min}-${this.poolConfig.max} connections`));

      this.setupEventHandlers();
      this.startHealthCheck();

      return newConnection;
    } catch (error: any) {
      this.isReconnecting = false;

      console.log(chalk.red('✗') + chalk.gray(' Database connection failed'));
      console.log(chalk.gray('  Error: ') + chalk.red(error.message));

      if (this.connectionAttempts < this.maxRetries) {
        this.connectionAttempts++;
        const delay = this.retryDelay * this.connectionAttempts;
        console.log(chalk.yellow('⟳') + chalk.gray(` Retry ${this.connectionAttempts}/${this.maxRetries} in ${delay}ms`));
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connect();
      }

      throw new Error(`Failed to connect after ${this.maxRetries} attempts: ${error.message}`);
    }
  }

  private setupEventHandlers(): void {
    if (!this.knexInstance) return;

    const client = this.knexInstance.client;

    if (client.pool) {
      client.pool.on('error', (err: Error) => {
        console.log(chalk.red('✗') + chalk.gray(' Pool Error: ') + chalk.red(err.message));
      });

      client.pool.on('warning', (warning: any) => {
        console.log(chalk.yellow('⚠') + chalk.gray(' Pool Warning: ') + chalk.yellow(warning));
      });

      client.pool.on('acquireRequest', (eventId: number) => {
        console.log(chalk.blue('◌') + chalk.gray(` Acquire request: ${eventId}`));
      });

      client.pool.on('acquireSuccess', (eventId: number) => {
        console.log(chalk.green('✓') + chalk.gray(` Acquire success: ${eventId}`));
      });

      client.pool.on('acquireFail', (eventId: number, err: Error) => {
        console.log(chalk.red('✗') + chalk.gray(` Acquire fail: ${eventId}`) + chalk.red(` ${err.message}`));
      });

      client.pool.on('release', () => {
        console.log(chalk.gray('◌') + chalk.gray(' Resource released'));
      });
    }
  }

  private startHealthCheck(): void {
    if (this.healthCheckInterval !== null) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        if (this.knexInstance) {
          await this.knexInstance.raw('SELECT 1');
          console.log(chalk.gray('◌') + chalk.gray(' Health check passed'));
        }
      } catch (error: any) {
        console.log(chalk.red('✗') + chalk.gray(' Health check failed: ') + chalk.red(error.message));
        this.knexInstance = null;
        this.connect().catch(() => {});
      }
    }, 20000);

    this.healthCheckInterval.unref();
  }

  async executeWithRetry<T>(
    fn: (db: Knex) => Promise<T>,
    retries = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const db = await this.connect();
        return await fn(db);
      } catch (error: any) {
        lastError = error;

        const isRetryableError =
          error.code === 'ETIMEDOUT' ||
          error.code === 'ECONNREFUSED' ||
          error.code === 'ECONNRESET' ||
          error.code === 'PROTOCOL_CONNECTION_LOST' ||
          error.code === 'ER_LOCK_WAIT_TIMEOUT' ||
          error.code === 'ER_QUERY_INTERRUPTED' ||
          error.message?.includes('timeout') ||
          error.message?.includes('ETIMEDOUT');

        if (!isRetryableError || attempt === retries) {
          throw error;
        }

        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(chalk.yellow('⟳') + chalk.gray(` Query retry ${attempt}/${retries} in ${delay}ms`));
        await new Promise(resolve => setTimeout(resolve, delay));
        this.knexInstance = null;
      }
    }

    throw lastError || new Error('Query failed after retries');
  }

  async query<T = any>(sql: string, bindings: any[] = []): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await this.executeWithRetry(async (db) => {
        const [rows] = await db.raw(sql, bindings);
        return rows as T;
      });
      const duration = Date.now() - startTime;
      console.log(chalk.gray('◌') + chalk.gray(` Query: ${sql.slice(0, 50)}... `) + chalk.cyan(`${duration}ms`));
      return result;
    } catch (error: any) {
      console.log(chalk.red('✗') + chalk.gray(` Query failed: ${sql.slice(0, 50)}... `) + chalk.red(error.message));
      throw error;
    }
  }

  async raw<T = any>(sql: string, bindings: any[] = []): Promise<T> {
    return this.executeWithRetry(async (db) => {
      return db.raw(sql, bindings) as Promise<T>;
    });
  }

  async select<T = any>(table: string, columns: string[] = ['*']): Promise<T[]> {
    return this.executeWithRetry(async (db) => {
      const result = await db(table).select(...columns);
      return result as unknown as T[];
    });
  }

  async insert<T = any>(table: string, data: any): Promise<T> {
    return this.executeWithRetry(async (db) => {
      const result = await db(table).insert(data);
      return result as unknown as T;
    });
  }

  async update<T = any>(table: string, data: any, where: any = {}): Promise<number> {
    return this.executeWithRetry(async (db) => {
      let query = db(table).update(data);
      Object.entries(where).forEach(([key, value]) => {
        query = query.where(key, value as any);
      });
      const result = await query;
      return result as number;
    });
  }

  async delete(table: string, where: any = {}): Promise<number> {
    return this.executeWithRetry(async (db) => {
      let query = db(table).delete();
      Object.entries(where).forEach(([key, value]) => {
        query = query.where(key, value as any);
      });
      const result = await query;
      return result as number;
    });
  }

  async transaction<T>(callback: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
    return this.executeWithRetry(async (db) => {
      return db.transaction(callback);
    });
  }

  getPoolStats(): PoolStats | null {
    if (!this.knexInstance?.client?.pool) return null;

    const pool = this.knexInstance.client.pool;
    
    return {
      total: (pool as any).numTotalObjects?.() || 0,
      available: (pool as any).numAvailableObjects?.() || 0,
      used: (pool as any).numUsedObjects?.() || 0,
      pending: (pool as any).numPendingObjects?.() || 0,
      max: this.poolConfig.max,
      min: this.poolConfig.min,
      acquireTimeout: this.poolConfig.acquireTimeoutMillis,
      idleTimeout: this.poolConfig.idleTimeoutMillis,
    };
  }

  async refreshPool(): Promise<void> {
    if (!this.knexInstance) {
      throw new Error('No database connection available');
    }

    try {
      console.log(chalk.yellow('⟳') + chalk.gray(' Refreshing pool...'));
      await this.knexInstance.client.pool.destroy();
      await this.connect();
      console.log(chalk.green('✓') + chalk.gray(' Pool refreshed successfully'));
    } catch (error: any) {
      console.log(chalk.red('✗') + chalk.gray(' Pool refresh failed: ') + chalk.red(error.message));
      throw error;
    }
  }

  async resizePool(min: number, max: number): Promise<void> {
    if (min < 0 || max < min) {
      throw new Error('Invalid pool size configuration');
    }

    this.poolConfig.min = min;
    this.poolConfig.max = max;

    if (this.knexInstance) {
      await this.refreshPool();
    }

    console.log(chalk.cyan('◌') + chalk.gray(` Pool resized to min: ${min}, max: ${max}`));
  }

  async drainPool(): Promise<void> {
    if (!this.knexInstance) {
      throw new Error('No database connection available');
    }

    console.log(chalk.yellow('⟳') + chalk.gray(' Draining pool...'));
    await this.knexInstance.client.pool.drain();
    console.log(chalk.green('✓') + chalk.gray(' Pool drained successfully'));
  }

  async clearPool(): Promise<void> {
    if (!this.knexInstance) {
      throw new Error('No database connection available');
    }

    console.log(chalk.yellow('⟳') + chalk.gray(' Clearing pool...'));
    await this.knexInstance.client.pool.clear();
    console.log(chalk.green('✓') + chalk.gray(' Pool cleared successfully'));
  }

  async getPoolStatus(): Promise<any> {
    if (!this.knexInstance?.client?.pool) {
      return null;
    }

    return {
      stats: this.getPoolStats(),
      isHealthy: await this.isPoolHealthy(),
      config: this.poolConfig,
      connectionStatus: 'connected',
      retryCount: this.connectionAttempts,
    };
  }

  async isPoolHealthy(): Promise<boolean> {
    try {
      if (!this.knexInstance) return false;
      await this.knexInstance.raw('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async setPoolConfig(config: Partial<typeof this.poolConfig>): Promise<void> {
    this.poolConfig = { ...this.poolConfig, ...config };
    console.log(chalk.cyan('◌') + chalk.gray(' Pool config updated'));

    if (this.knexInstance) {
      await this.refreshPool();
    }
  }

  async waitForPoolReady(timeout: number = 30000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await this.isPoolHealthy()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return false;
  }

  async destroy(): Promise<void> {
    if (this.healthCheckInterval !== null) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.knexInstance) {
      try {
        await this.knexInstance.destroy();
        this.knexInstance = null;
        console.log(chalk.gray('◌') + chalk.gray(' Database connection destroyed'));
      } catch (error: any) {
        console.log(chalk.red('✗') + chalk.gray(' Error destroying connection: ') + chalk.red(error.message));
      }
    }
  }
}

const dbInstance = Database.getInstance();

export const db = () => dbInstance.connect();
export const getPool = async () => await dbInstance.connect();

export const query = <T = any>(sql: string, bindings: any[] = []) =>
  dbInstance.query<T>(sql, bindings);
export const raw = <T = any>(sql: string, bindings: any[] = []) =>
  dbInstance.raw<T>(sql, bindings);
export const select = <T = any>(table: string, columns?: string[]) =>
  dbInstance.select<T>(table, columns);
export const insert = <T = any>(table: string, data: any) =>
  dbInstance.insert<T>(table, data);
export const update = <T = any>(table: string, data: any, where?: any) =>
  dbInstance.update<T>(table, data, where);
export const deleteRecord = (table: string, where?: any) =>
  dbInstance.delete(table, where);
export const transaction = <T,>(callback: (trx: Knex.Transaction) => Promise<T>) =>
  dbInstance.transaction<T>(callback);
export const getPoolStats = () => dbInstance.getPoolStats();
export const refreshPool = () => dbInstance.refreshPool();
export const resizePool = (min: number, max: number) => dbInstance.resizePool(min, max);
export const drainPool = () => dbInstance.drainPool();
export const clearPool = () => dbInstance.clearPool();
export const getPoolStatus = () => dbInstance.getPoolStatus();
export const isPoolHealthy = () => dbInstance.isPoolHealthy();
export const setPoolConfig = (config: Partial<{ min: number; max: number; acquireTimeoutMillis: number; idleTimeoutMillis: number; reapIntervalMillis: number }>) => 
  dbInstance.setPoolConfig(config);
export const waitForPoolReady = (timeout?: number) => dbInstance.waitForPoolReady(timeout);
export const closeDb = () => dbInstance.destroy();

process.on('SIGINT', async () => {
  console.log(chalk.gray('◌') + chalk.gray(' Shutting down...'));
  await closeDb();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(chalk.gray('◌') + chalk.gray(' Shutting down...'));
  await closeDb();
  process.exit(0);
});

export default dbInstance;