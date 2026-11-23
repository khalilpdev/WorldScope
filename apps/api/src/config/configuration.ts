import { CACHE_TTL_SECONDS } from '@worldscope/shared';

function toInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return !['0', 'false', 'no', 'off'].includes(value.trim().toLowerCase());
}

export interface AppConfiguration {
  nodeEnv: string;
  isProduction: boolean;
  app: {
    port: number;
    webOrigins: string[];
  };
  redis: {
    url: string;
    enabled: boolean;
  };
  providers: {
    catalogBaseUrl: string;
    flagCdnBaseUrl: string;
    worldBankBaseUrl: string;
    openMeteoBaseUrl: string;
  };
  http: {
    timeoutMs: number;
  };
  cache: {
    catalogTtlSeconds: number;
    indicatorsTtlSeconds: number;
    weatherTtlSeconds: number;
  };
  rateLimit: {
    ttlSeconds: number;
    maxRequests: number;
  };
}

export function configuration(): AppConfiguration {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    app: {
      port: toInt(process.env.API_PORT, 3000),
      webOrigins: (process.env.WEB_ORIGIN ?? 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    },
    redis: {
      url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
      enabled: toBoolean(process.env.CACHE_ENABLED, true),
    },
    providers: {
      catalogBaseUrl:
        process.env.COUNTRY_CATALOG_BASE_URL ??
        'https://raw.githubusercontent.com/mledoze/countries/5d15c0ff8c87ef2f1f8e944093522d4b2de2dd5b',
      flagCdnBaseUrl: process.env.FLAG_CDN_BASE_URL ?? 'https://flagcdn.com',
      worldBankBaseUrl: process.env.WORLD_BANK_BASE_URL ?? 'https://api.worldbank.org/v2',
      openMeteoBaseUrl: process.env.OPEN_METEO_BASE_URL ?? 'https://api.open-meteo.com/v1',
    },
    http: {
      timeoutMs: toInt(process.env.HTTP_TIMEOUT_MS, 8000),
    },
    cache: {
      catalogTtlSeconds: toInt(
        process.env.CACHE_TTL_CATALOG_SECONDS,
        CACHE_TTL_SECONDS.catalog,
      ),
      indicatorsTtlSeconds: toInt(
        process.env.CACHE_TTL_INDICATORS_SECONDS,
        CACHE_TTL_SECONDS.indicators,
      ),
      weatherTtlSeconds: toInt(
        process.env.CACHE_TTL_WEATHER_SECONDS,
        CACHE_TTL_SECONDS.weather,
      ),
    },
    rateLimit: {
      ttlSeconds: toInt(process.env.RATE_LIMIT_TTL_SECONDS, 60),
      maxRequests: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 120),
    },
  };
}
