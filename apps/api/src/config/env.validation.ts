/**
 * Validates the environment once at boot. Using plain assertions keeps the
 * dependency footprint small while still failing fast on misconfiguration.
 */
export function validateEnv(raw: Record<string, unknown>): Record<string, unknown> {
  const errors: string[] = [];

  const databaseUrl = String(raw.DATABASE_URL ?? '');
  if (!databaseUrl) {
    errors.push('DATABASE_URL is required (see .env.example).');
  } else if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    errors.push('DATABASE_URL must be a PostgreSQL connection string.');
  }

  const redisUrl = String(raw.REDIS_URL ?? 'redis://127.0.0.1:6379');
  if (!/^rediss?:\/\//.test(redisUrl)) {
    errors.push('REDIS_URL must start with redis:// or rediss://.');
  }

  for (const key of [
    'COUNTRY_CATALOG_BASE_URL',
    'FLAG_CDN_BASE_URL',
    'WORLD_BANK_BASE_URL',
    'OPEN_METEO_BASE_URL',
  ]) {
    const value = raw[key];
    if (value === undefined) continue;
    try {
      const url = new URL(String(value));
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push(`${key} must use http or https.`);
      }
    } catch {
      errors.push(`${key} must be a valid absolute URL.`);
    }
  }

  const numericChecks: Array<[string, number, number]> = [
    ['API_PORT', 1, 65535],
    ['HTTP_TIMEOUT_MS', 500, 60000],
    ['RATE_LIMIT_MAX_REQUESTS', 1, 100000],
    ['RATE_LIMIT_TTL_SECONDS', 1, 86400],
  ];
  for (const [key, min, max] of numericChecks) {
    const rawValue = raw[key];
    if (rawValue === undefined) continue;
    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
      errors.push(`${key} must be an integer between ${min} and ${max}.`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return raw;
}
