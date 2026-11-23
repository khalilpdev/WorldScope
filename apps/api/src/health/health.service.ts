import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { HealthDependency, HealthResponse } from '@worldscope/shared';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';

const APP_VERSION = process.env.APP_VERSION ?? '1.0.0';

@Injectable()
export class HealthService {
  private readonly environment: string;
  private readonly startedAt = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    config: ConfigService,
  ) {
    this.environment = config.getOrThrow<string>('nodeEnv');
  }

  async check(): Promise<HealthResponse> {
    const [databaseProbe, cacheStatus] = await Promise.all([
      this.prisma.probe(),
      this.cache.status(),
    ]);

    const database: HealthDependency = {
      status: databaseProbe.error ? 'down' : 'up',
      latencyMs: databaseProbe.latencyMs,
      driver: 'postgresql',
      ...(databaseProbe.error ? { detail: databaseProbe.error } : {}),
    };

    const cache: HealthDependency = {
      status: cacheStatus.status,
      latencyMs: cacheStatus.latencyMs,
      driver: cacheStatus.driver,
      ...(cacheStatus.detail ? { detail: cacheStatus.detail } : {}),
    };

    const healthy = database.status === 'up' && cache.status !== 'down';

    return {
      status: healthy ? 'ok' : 'degraded',
      version: APP_VERSION,
      environment: this.environment,
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      dependencies: { database, cache },
    };
  }

  live(): { status: 'ok'; uptimeSeconds: number; timestamp: string } {
    return {
      status: 'ok',
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
