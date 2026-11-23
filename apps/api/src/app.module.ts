import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from './cache/cache.module';
import { HttpModule } from './common/http/http.module';
import { CompareModule } from './compare/compare.module';
import { SavedComparisonsModule } from './comparisons/saved-comparisons.module';
import { configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { CountriesModule } from './countries/countries.module';
import { FavoritesModule } from './favorites/favorites.module';
import { HealthModule } from './health/health.module';
import { OverviewModule } from './overview/overview.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Running from apps/api uses the repository root .env; containers receive
      // real environment variables from Compose.
      envFilePath: ['.env', '../../.env'],
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.getOrThrow<number>('rateLimit.ttlSeconds') * 1000,
            limit: config.getOrThrow<number>('rateLimit.maxRequests'),
          },
        ],
      }),
    }),
    HttpModule,
    CacheModule,
    PrismaModule,
    ProvidersModule,
    CountriesModule,
    CompareModule,
    FavoritesModule,
    SavedComparisonsModule,
    OverviewModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
