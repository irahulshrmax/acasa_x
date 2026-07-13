// lib/cache/index.ts - ADVANCED PRODUCTION CACHE (FIXED)

import { LRUCache } from 'lru-cache';
import { EventEmitter } from 'events';

// ─── TYPES ─────────────────────────────────────────────────────────────

interface CacheItem<T = any> {
  data: T;
  expiry: number;
  createdAt: number;
  hits: number;
  lastAccessed: number;
  tags: string[];
  version: number;
}

interface CacheStats {
  totalItems: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
  pendingRequests: number;
  oldestItem: number;
  newestItem: number;
}

interface CacheConfig {
  maxItems?: number;
  maxSize?: number;
  defaultTTL?: number;
  enableStats?: boolean;
  enableTags?: boolean;
  enableVersioning?: boolean;
  compressionThreshold?: number;
}

// ─── CONFIGURATION ─────────────────────────────────────────────────────

const DEFAULT_CONFIG: CacheConfig = {
  maxItems: 1000,
  maxSize: 100_000_000, // 100MB
  defaultTTL: 300,
  enableStats: true,
  enableTags: true,
  enableVersioning: true,
  compressionThreshold: 1024 * 10, // 10KB
};

// ─── COMPRESSION ──────────────────────────────────────────────────────

class CacheCompression {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  static compress(data: any): any {
    if (!data) return data;
    
    try {
      const json = JSON.stringify(data);
      
      // Small data - no compression needed
      if (json.length < 1024 * 10) return data;
      
      // For large data, try to optimize
      if (Array.isArray(data) && data.length > 100) {
        // Remove redundant fields
        return this.optimizeArray(data);
      }
      
      return data;
    } catch {
      return data;
    }
  }

  static decompress(data: any): any {
    return data;
  }

  private static optimizeArray(arr: any[]): any[] {
    if (!arr.length) return arr;
    
    // Get all keys from first item
    const keys = Object.keys(arr[0]);
    
    // Check if all items have same structure
    const sameStructure = arr.every(item => 
      Object.keys(item).length === keys.length &&
      keys.every(k => k in item)
    );
    
    if (!sameStructure) return arr;
    
    // Convert to columnar format for better compression
    const columnar: any = { _meta: { keys, rows: arr.length } };
    for (const key of keys) {
      columnar[key] = arr.map(item => item[key]);
    }
    
    return columnar;
  }
}

// ─── MAIN CACHE CLASS ──────────────────────────────────────────────────

class AdvancedCache extends EventEmitter {
  private memoryCache: LRUCache<string, CacheItem>;
  private pending: Map<string, Promise<any>>;
  private stats: CacheStats;
  private config: CacheConfig;
  private tagMap: Map<string, Set<string>>;
  private versionMap: Map<string, number>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig = {}) {
    super();
    
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.pending = new Map();
    this.tagMap = new Map();
    this.versionMap = new Map();
    
    this.stats = {
      totalItems: 0,
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0,
      memoryUsage: 0,
      pendingRequests: 0,
      oldestItem: Date.now(),
      newestItem: Date.now(),
    };

    // ✅ FIXED: LRU Cache initialization with correct options
    this.memoryCache = new LRUCache<string, CacheItem>({
      max: this.config.maxItems || 1000,
      maxSize: this.config.maxSize || 100_000_000,
      sizeCalculation: (item) => this.calculateSize(item),
      ttl: (this.config.defaultTTL || 300) * 1000,
      ttlAutopurge: true, // ✅ FIXED: Auto purge expired items
      allowStale: false,
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });

    // Start cleanup interval
    this.startCleanup();
  }

  // ─── SIZE CALCULATION ──────────────────────────────────────────────

  private calculateSize(item: CacheItem): number {
    try {
      const str = JSON.stringify(item);
      return str.length;
    } catch {
      return 1024; // Default size
    }
  }

  // ─── COMPRESSION ────────────────────────────────────────────────────

  private compressData(data: any): any {
    if (!data) return data;
    
    try {
      const size = JSON.stringify(data).length;
      if (size > (this.config.compressionThreshold || 10240)) {
        return CacheCompression.compress(data);
      }
      return data;
    } catch {
      return data;
    }
  }

  private decompressData(data: any): any {
    return CacheCompression.decompress(data);
  }

  // ─── CORE CACHE OPERATIONS ──────────────────────────────────────────

  async get<T>(key: string, options?: {
    validate?: (data: T) => boolean;
    refresh?: boolean;
  }): Promise<T | null> {
    const item = this.memoryCache.get(key);
    
    if (!item) {
      this.stats.totalMisses++;
      this.updateStats();
      return null;
    }

    // Check expiry
    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      this.stats.totalMisses++;
      this.updateStats();
      return null;
    }

    // Validate data
    if (options?.validate && !options.validate(item.data)) {
      this.memoryCache.delete(key);
      this.stats.totalMisses++;
      this.updateStats();
      return null;
    }

    // Update stats
    item.hits++;
    item.lastAccessed = Date.now();
    this.stats.totalHits++;
    this.updateStats();

    // Emit hit event
    this.emit('hit', { key, tags: item.tags, hits: item.hits });

    return this.decompressData(item.data) as T;
  }

  async set(
    key: string, 
    data: any, 
    options?: {
      ttl?: number;
      tags?: string[];
      version?: number;
      compress?: boolean;
    }
  ): Promise<void> {
    // ✅ FIXED: Safely handle ttl with default
    const ttl = options?.ttl ?? this.config.defaultTTL ?? 300;
    const tags = options?.tags || [];
    const version = options?.version || this.getNextVersion(key);

    const compressedData = options?.compress !== false 
      ? this.compressData(data)
      : data;

    const item: CacheItem = {
      data: compressedData,
      expiry: Date.now() + ttl * 1000,
      createdAt: Date.now(),
      hits: 0,
      lastAccessed: Date.now(),
      tags,
      version,
    };

    this.memoryCache.set(key, item);

    // Update tag map
    if (this.config.enableTags) {
      for (const tag of tags) {
        if (!this.tagMap.has(tag)) {
          this.tagMap.set(tag, new Set());
        }
        this.tagMap.get(tag)!.add(key);
      }
    }

    // Update version map
    if (this.config.enableVersioning) {
      this.versionMap.set(key, version);
    }

    // Update stats
    this.stats.totalItems = this.memoryCache.size;
    this.stats.newestItem = Date.now();
    this.updateStats();

    // Emit set event
    this.emit('set', { key, tags, ttl, version });
  }

  async del(key: string): Promise<void> {
    const item = this.memoryCache.get(key);
    if (item) {
      // Remove from tag map
      if (this.config.enableTags) {
        for (const tag of item.tags) {
          const keys = this.tagMap.get(tag);
          if (keys) {
            keys.delete(key);
            if (keys.size === 0) {
              this.tagMap.delete(tag);
            }
          }
        }
      }
      
      // Remove from version map
      if (this.config.enableVersioning) {
        this.versionMap.delete(key);
      }
    }

    this.memoryCache.delete(key);
    this.stats.totalItems = this.memoryCache.size;
    this.updateStats();

    this.emit('delete', { key });
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete: string[] = [];

    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.del(key);
    }

    this.emit('deletePattern', { pattern, count: keysToDelete.length });
  }

  async delByTag(tag: string): Promise<void> {
    const keys = this.tagMap.get(tag);
    if (!keys) return;

    const keysArray = Array.from(keys);
    for (const key of keysArray) {
      await this.del(key);
    }

    this.emit('deleteByTag', { tag, count: keysArray.length });
  }

  async delByVersion(key: string, version: number): Promise<void> {
    const item = this.memoryCache.get(key);
    if (item && item.version === version) {
      await this.del(key);
    }
  }

  // ─── VERSIONING ──────────────────────────────────────────────────────

  private getNextVersion(key: string): number {
    const current = this.versionMap.get(key) || 0;
    return current + 1;
  }

  async getVersion(key: string): Promise<number | null> {
    const item = this.memoryCache.get(key);
    return item ? item.version : null;
  }

  async incrementVersion(key: string): Promise<number> {
    const newVersion = this.getNextVersion(key);
    this.versionMap.set(key, newVersion);
    
    const item = this.memoryCache.get(key);
    if (item) {
      item.version = newVersion;
    }
    
    return newVersion;
  }

  // ─── REQUEST DEDUPLICATION ──────────────────────────────────────────

  async dedupe<T>(
    key: string, 
    fn: () => Promise<T>,
    options?: {
      ttl?: number;
      tags?: string[];
      forceRefresh?: boolean;
    }
  ): Promise<T> {
    // If force refresh, bypass dedupe
    if (options?.forceRefresh) {
      const result = await fn();
      await this.set(key, result, {
        ttl: options.ttl,
        tags: options.tags,
      });
      return result;
    }

    // Check if already pending
    if (this.pending.has(key)) {
      this.stats.pendingRequests++;
      this.emit('dedupeHit', { key });
      return this.pending.get(key)!;
    }

    // Check cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute and cache
    const promise = fn()
      .then(async (result) => {
        await this.set(key, result, {
          ttl: options?.ttl,
          tags: options?.tags,
        });
        return result;
      })
      .finally(() => {
        this.pending.delete(key);
        this.stats.pendingRequests = Math.max(0, this.stats.pendingRequests - 1);
        this.updateStats();
      });

    this.pending.set(key, promise);
    this.stats.pendingRequests++;
    this.updateStats();
    this.emit('dedupeMiss', { key });

    return promise;
  }

  // ─── BATCH OPERATIONS ──────────────────────────────────────────────

  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>();
    const missingKeys: string[] = [];

    for (const key of keys) {
      const value = await this.get<T>(key);
      if (value !== null) {
        result.set(key, value);
      } else {
        missingKeys.push(key);
      }
    }

    return result;
  }

  async mset(items: Array<{
    key: string;
    data: any;
    ttl?: number;
    tags?: string[];
  }>): Promise<void> {
    await Promise.all(
      items.map(({ key, data, ttl, tags }) => 
        this.set(key, data, { ttl, tags })
      )
    );
  }

  // ─── STATISTICS ──────────────────────────────────────────────────────

  private updateStats(): void {
    const total = this.stats.totalHits + this.stats.totalMisses;
    this.stats.hitRate = total > 0 ? this.stats.totalHits / total : 0;
    this.stats.memoryUsage = this.calculateMemoryUsage();
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const item of this.memoryCache.values()) {
      totalSize += this.calculateSize(item);
    }
    return totalSize;
  }

  getStats(): CacheStats {
    return {
      ...this.stats,
      totalItems: this.memoryCache.size,
      hitRate: Math.round(this.stats.hitRate * 100) / 100,
    };
  }

  async clearStats(): Promise<void> {
    this.stats = {
      totalItems: this.memoryCache.size,
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0,
      memoryUsage: this.calculateMemoryUsage(),
      pendingRequests: this.pending.size,
      oldestItem: Date.now(),
      newestItem: Date.now(),
    };
  }

  // ─── CACHE MANAGEMENT ──────────────────────────────────────────────

  async warmup(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    await Promise.all(
      keys.map(async (key) => {
        if (!this.memoryCache.has(key)) {
          try {
            const data = await fetcher(key);
            await this.set(key, data);
          } catch (error) {
            this.emit('warmupError', { key, error });
          }
        }
      })
    );
    this.emit('warmupComplete', { count: keys.length });
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.tagMap.clear();
    this.versionMap.clear();
    this.pending.clear();
    
    this.stats.totalItems = 0;
    this.stats.pendingRequests = 0;
    this.updateStats();

    this.emit('clear');
  }

  async prune(): Promise<number> {
    const expiredKeys: string[] = [];
    const now = Date.now();

    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiry) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.del(key);
    }

    this.emit('prune', { count: expiredKeys.length });
    return expiredKeys.length;
  }

  // ─── CLEANUP INTERVAL ──────────────────────────────────────────────

  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(async () => {
      await this.prune();
    }, 60000); // Every minute
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // ─── KEY GENERATORS ──────────────────────────────────────────────────

  static generateKey(...parts: (string | number)[]): string {
    return parts.map(p => String(p)).join(':');
  }

  static generatePattern(...parts: (string | number)[]): string {
    return parts.map(p => String(p)).join(':') + ':*';
  }

  // ─── METRICS FOR MONITORING ────────────────────────────────────────

  getMetrics(): Record<string, any> {
    return {
      cache: this.getStats(),
      pending: {
        count: this.pending.size,
        keys: Array.from(this.pending.keys()),
      },
      tags: {
        total: this.tagMap.size,
        details: Object.fromEntries(
          Array.from(this.tagMap.entries()).map(([tag, keys]) => [
            tag,
            { count: keys.size, keys: Array.from(keys).slice(0, 10) }
          ])
        ),
      },
      versions: {
        total: this.versionMap.size,
      },
      memory: {
        used: this.stats.memoryUsage,
        max: this.config.maxSize || 100_000_000,
        percentage: ((this.stats.memoryUsage / (this.config.maxSize || 1)) * 100),
      },
    };
  }

  // ─── EVENT HANDLERS ──────────────────────────────────────────────────

  onHit(callback: (data: { key: string; tags: string[]; hits: number }) => void): void {
    this.on('hit', callback);
  }

  onMiss(callback: (data: { key: string }) => void): void {
    this.on('miss', callback);
  }

  onSet(callback: (data: { key: string; tags: string[]; ttl: number; version: number }) => void): void {
    this.on('set', callback);
  }

  onDelete(callback: (data: { key: string }) => void): void {
    this.on('delete', callback);
  }

  onDedupeHit(callback: (data: { key: string }) => void): void {
    this.on('dedupeHit', callback);
  }

  onDedupeMiss(callback: (data: { key: string }) => void): void {
    this.on('dedupeMiss', callback);
  }

  // ─── DESTROY ──────────────────────────────────────────────────────────

  destroy(): void {
    this.stopCleanup();
    this.clear();
    this.removeAllListeners();
    this.emit('destroy');
  }
}

// ─── SINGLETON EXPORT ──────────────────────────────────────────────────

export const cache = new AdvancedCache({
  maxItems: 1000,
  maxSize: 100_000_000,
  defaultTTL: 300,
  enableStats: true,
  enableTags: true,
  enableVersioning: true,
  compressionThreshold: 1024 * 10,
});

// ─── UTILITY DECORATORS ───────────────────────────────────────────────

export function Cached(ttl: number = 300, tags: string[] = []) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = AdvancedCache.generateKey(
        propertyKey,
        ...args.map((a: any) => JSON.stringify(a))
      );

      return cache.dedupe(key, async () => {
        return originalMethod.apply(this, args);
      }, { ttl, tags });
    };

    return descriptor;
  };
}

export function CacheInvalidate(pattern: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      await cache.delPattern(pattern);
      return result;
    };

    return descriptor;
  };
}

// ─── EXPORT TYPES ──────────────────────────────────────────────────────

export type { CacheStats, CacheConfig, CacheItem };