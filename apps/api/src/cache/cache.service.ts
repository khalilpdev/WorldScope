import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface MemoryEntry {
  value: unknown;
  expiresAt: number;
}

export interface CacheLookup<T> {
  value: T;
  cached: boolean;
}

export interface CacheStatus {
  status: 'up' | 'down' | 'disabled';
  latencyMs: number | null;
  driver: 'redis' | 'memory';
  detail?: string;
}

const MEMORY_MAX_ENTRIES = 500;

/**
 * Two-tier cache.
 *
 * Redis is the shared cache defined by the architecture. When Redis is not
 * reachable — a common situation when running the API without Docker — the
 * service degrades to a bounded in-memory map instead of failing requests.
 * A Redis hiccup never takes the API down; it only lowers cache hit rates.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly memory = new Map<string, MemoryEntry>();
  private readonly enabled: boolean;
  private readonly redisUrl: string;
  private redis: Redis | null = null;
  private redisStatus: 'unknown' | 'up' | 'down' = 'unknown';
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor(config: ConfigService) {
    this.enabled = config.getOrThrow<boolean>('redis.enabled');
    this.redisUrl = config.getOrThrow<string>('redis.url');

    if (this.enabled) {
      this.createRedisClient();
    } else {
      this.logger.log('Redis cache disabled (CACHE_ENABLED=false); using in-memory cache');
    }

    this.cleanupTimer = setInterval(() => this.evictExpired(), 60_000);
    this.cleanupTimer.unref();
  }

  private createRedisClient(): void {
    const client = new Redis(this.redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 2_000,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1_000)),
    });

    client.on('ready', () => {
      this.redisStatus = 'up';
      this.logger.log('Redis cache connected');
    });
    client.on('error', (error: Error) => {
      if (this.redisStatus !== 'down') {
        this.logger.warn(
          `Redis unavailable (${error.message}). Falling back to in-memory cache.`,
        );
      }
      this.redisStatus = 'down';
    });
    client.on('end', () => {
      if (this.redisStatus === 'up') {
        this.logger.warn('Redis connection closed; using in-memory cache');
      }
      this.redisStatus = 'down';
    });

    this.redis = client;
    client.connect().catch(() => {
      this.redisStatus = 'down';
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis && this.redisStatus === 'up') {
      try {
        const raw = await this.redis.get(key);
        if (raw !== null) return JSON.parse(raw) as T;
      } catch (error) {
        this.logger.warn(`Redis GET failed for ${key}: ${(error as Error).message}`);
        this.redisStatus = 'down';
      }
    }
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.setMemory(key, value, ttlSeconds);
    if (this.redis && this.redisStatus === 'up') {
      try {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      } catch (error) {
        this.logger.warn(`Redis SET failed for ${key}: ${(error as Error).message}`);
        this.redisStatus = 'down';
      }
    }
  }

  /**
   * Returns the cached value or executes the producer and stores its result.
   */
  async wrap<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<CacheLookup<T>> {
    const cached = await this.get<T>(key);
    if (cached !== null) return { value: cached, cached: true };

    const value = await producer();
    await this.set(key, value, ttlSeconds);
    return { value, cached: false };
  }

  async delete(key: string): Promise<void> {
    this.memory.delete(key);
    if (this.redis && this.redisStatus === 'up') {
      try {
        await this.redis.del(key);
      } catch {
        this.redisStatus = 'down';
      }
    }
  }

  async status(): Promise<CacheStatus> {
    if (!this.enabled) {
      return { status: 'disabled', latencyMs: null, driver: 'memory' };
    }
    if (this.redis && this.redisStatus === 'up') {
      const started = performance.now();
      try {
        await this.redis.ping();
        return {
          status: 'up',
          latencyMs: Math.round(performance.now() - started),
          driver: 'redis',
        };
      } catch (error) {
        this.redisStatus = 'down';
        return {
          status: 'down',
          latencyMs: null,
          driver: 'memory',
          detail: (error as Error).message,
        };
      }
    }
    return {
      status: 'down',
      latencyMs: null,
      driver: 'memory',
      detail: 'Redis not reachable; serving from process memory',
    };
  }

  private setMemory<T>(key: string, value: T, ttlSeconds: number): void {
    if (this.memory.size >= MEMORY_MAX_ENTRIES) {
      const oldestKey = this.memory.keys().next().value;
      if (oldestKey !== undefined) this.memory.delete(oldestKey);
    }
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1_000 });
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.memory) {
      if (entry.expiresAt <= now) this.memory.delete(key);
    }
  }

  async onModuleDestroy(): Promise<void> {
    clearInterval(this.cleanupTimer);
    if (this.redis) {
      this.redis.disconnect();
      this.redis = null;
    }
  }
}
