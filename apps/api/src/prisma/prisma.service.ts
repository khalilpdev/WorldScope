import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface DatabaseProbe {
  latencyMs: number | null;
  error: string | null;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.connected = true;
      this.logger.log('Connected to PostgreSQL');
    } catch (error) {
      // The API still boots so read-only endpoints keep working; health reports
      // the database as down and write endpoints return 503.
      this.connected = false;
      this.logger.error(
        `Could not connect to PostgreSQL: ${(error as Error).message}. ` +
          'Start it with "docker compose up -d postgres" and run migrations.',
      );
    }
  }

  async probe(): Promise<DatabaseProbe> {
    if (!this.connected) {
      return { latencyMs: null, error: 'not connected' };
    }
    const started = performance.now();
    try {
      await this.$queryRaw`SELECT 1`;
      return { latencyMs: Math.round(performance.now() - started), error: null };
    } catch (error) {
      return { latencyMs: null, error: (error as Error).message };
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
