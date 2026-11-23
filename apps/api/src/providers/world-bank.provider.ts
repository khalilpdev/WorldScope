import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DataSourceInfo } from '@worldscope/shared';
import { CacheService } from '../cache/cache.service';
import { HttpClientService } from '../common/http/http-client.service';
import { ProviderError } from '../common/errors/provider.error';

interface WorldBankEnvelopeRow {
  id?: string;
  iso2Code?: string;
  name?: string;
  country?: { id?: string; value?: string };
  countryiso3code?: string;
  region?: { id?: string; value?: string };
  incomeLevel?: { id?: string; value?: string };
  capitalCity?: string;
  longitude?: string;
  latitude?: string;
  date?: string;
  value?: number | null;
}

type WorldBankResponse = [unknown, WorldBankEnvelopeRow[] | null];

export interface WorldBankCountryMeta {
  code: string;
  name: string;
  region: string | null;
  incomeLevel: string | null;
  capitalCity: string | null;
  coordinates: { lat: number; lng: number } | null;
}

export interface PopulationValue {
  value: number;
  year: string;
}

export interface YearValue {
  year: number;
  value: number;
}

export interface LatestValue {
  value: number;
  year: number;
}

/** Cached payload keeps the retrieval timestamp next to the data it belongs to. */
interface StoredPayload<T> {
  data: T;
  retrievedAt: string;
}

export interface WorldBankResult<T> {
  data: T;
  retrievedAt: string;
  cached: boolean;
}

const META_CACHE_KEY = 'worldscope:wb:meta:v3';
const POPULATION_CACHE_KEY = 'worldscope:wb:population:v4';
/** Recent years are enough to find the newest released datapoint. */
const RECENT_YEARS = '2022:2026';

@Injectable()
export class WorldBankProvider {
  private readonly logger = new Logger(WorldBankProvider.name);
  private readonly baseUrl: string;
  private readonly ttlSeconds: number;

  constructor(
    private readonly http: HttpClientService,
    private readonly cache: CacheService,
    config: ConfigService,
  ) {
    this.baseUrl = config.getOrThrow<string>('providers.worldBankBaseUrl');
    this.ttlSeconds = config.getOrThrow<number>('cache.indicatorsTtlSeconds');
  }

  sourceInfo(retrievedAt: string): DataSourceInfo {
    return {
      id: 'world-bank',
      name: 'World Bank Open Data',
      url: 'https://data.worldbank.org/',
      retrievedAt,
      license: 'CC BY 4.0',
      note: 'Annual indicator series. The most recent year available varies per country and indicator.',
    };
  }

  /** Country metadata: region, income level and capital coordinates. */
  async getCountryMetadata(): Promise<
    WorldBankResult<Array<[string, WorldBankCountryMeta]>>
  > {
    return this.resolve(META_CACHE_KEY, () => this.fetchCountryMetadata());
  }

  /** Latest available population per country, resolved from one bulk request. */
  async getLatestPopulation(): Promise<WorldBankResult<Array<[string, PopulationValue]>>> {
    return this.resolve(POPULATION_CACHE_KEY, () => this.fetchLatestPopulation());
  }

  /**
   * Latest non-null value of several indicators for a few countries. One HTTP
   * request per indicator keeps the upstream call count small and predictable.
   */
  async getLatestValues(
    codes: string[],
    indicatorIds: readonly string[],
  ): Promise<WorldBankResult<Record<string, Array<[string, LatestValue]>>>> {
    const normalized = [...codes].map((code) => code.toUpperCase()).sort();
    const cacheKey = `worldscope:wb:latest:v3:${normalized.join('-')}:${indicatorIds.join('-')}`;

    return this.resolve(cacheKey, async () => {
      const results = await Promise.all(
        indicatorIds.map((indicatorId) => this.fetchLatestValues(normalized, indicatorId)),
      );
      const record: Record<string, Array<[string, LatestValue]>> = {};
      indicatorIds.forEach((indicatorId, index) => {
        record[indicatorId] = Array.from((results[index] ?? new Map()).entries());
      });
      return record;
    });
  }

  /** Full yearly series for one country, used by the detail charts. */
  async getSeries(
    code: string,
    indicatorIds: readonly string[],
    fromYear: number,
  ): Promise<WorldBankResult<Record<string, YearValue[]>>> {
    const toYear = new Date().getFullYear();
    const cacheKey = `worldscope:wb:series:v3:${code.toUpperCase()}:${indicatorIds.join('-')}:${fromYear}`;

    return this.resolve(cacheKey, async () => {
      const series = await Promise.all(
        indicatorIds.map((indicatorId) =>
          this.fetchSeries(code.toUpperCase(), indicatorId, `${fromYear}:${toYear}`),
        ),
      );
      const record: Record<string, YearValue[]> = {};
      indicatorIds.forEach((indicatorId, index) => {
        record[indicatorId] = series[index] ?? [];
      });
      return record;
    });
  }

  private async resolve<T>(
    cacheKey: string,
    producer: () => Promise<StoredPayload<T>['data']>,
  ): Promise<WorldBankResult<T>> {
    const { value, cached } = await this.cache.wrap<StoredPayload<T>>(
      cacheKey,
      this.ttlSeconds,
      async () => ({ data: await producer(), retrievedAt: new Date().toISOString() }),
    );
    return { data: value.data, retrievedAt: value.retrievedAt, cached };
  }

  private async fetchCountryMetadata(): Promise<Array<[string, WorldBankCountryMeta]>> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/country?format=json&per_page=400`;
    const payload = await this.http.getJson<WorldBankResponse>(url, { provider: 'world-bank' });
    const rows = this.rows(payload, 'country metadata');

    const map = new Map<string, WorldBankCountryMeta>();
    for (const row of rows) {
      const code = row.id ?? row.countryiso3code;
      // Aggregates (regions, income groups) carry region id "NA".
      if (!code || code.length !== 3 || row.region?.id === 'NA') continue;

      const lat = Number.parseFloat(row.latitude ?? '');
      const lng = Number.parseFloat(row.longitude ?? '');
      map.set(code.toUpperCase(), {
        code: code.toUpperCase(),
        name: row.name ?? row.country?.value ?? code,
        region: row.region?.value?.trim() ?? null,
        incomeLevel: row.incomeLevel?.value ?? null,
        capitalCity: row.capitalCity ?? null,
        coordinates: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
      });
    }
    this.logger.log(`World Bank country metadata loaded: ${map.size} countries`);
    return Array.from(map.entries());
  }

  private async fetchLatestPopulation(): Promise<Array<[string, PopulationValue]>> {
    const url =
      `${this.baseUrl.replace(/\/$/, '')}/country/all/indicator/SP.POP.TOTL` +
      `?format=json&per_page=2000&date=${RECENT_YEARS}`;
    const payload = await this.http.getJson<WorldBankResponse>(url, { provider: 'world-bank' });
    const rows = this.rows(payload, 'population');

    const map = new Map<string, PopulationValue>();
    for (const row of rows) {
      const code = row.countryiso3code?.toUpperCase();
      if (!code || code.length !== 3 || typeof row.value !== 'number' || !row.date) continue;
      const current = map.get(code);
      if (!current || Number(row.date) > Number(current.year)) {
        map.set(code, { value: row.value, year: row.date });
      }
    }
    this.logger.log(`World Bank population loaded for ${map.size} codes`);
    return Array.from(map.entries());
  }

  private async fetchLatestValues(
    codes: string[],
    indicatorId: string,
  ): Promise<Map<string, LatestValue>> {
    const url =
      `${this.baseUrl.replace(/\/$/, '')}/country/${codes.join(';')}/indicator/${indicatorId}` +
      `?format=json&per_page=200&date=${RECENT_YEARS}`;
    const payload = await this.http.getJson<WorldBankResponse>(url, { provider: 'world-bank' });
    const rows = this.rows(payload, `${indicatorId} for ${codes.join(';')}`);

    const map = new Map<string, LatestValue>();
    for (const row of rows) {
      const code = row.countryiso3code?.toUpperCase();
      if (!code || typeof row.value !== 'number' || !row.date) continue;
      const year = Number.parseInt(row.date, 10);
      const current = map.get(code);
      if (!current || year > current.year) {
        map.set(code, { value: row.value, year });
      }
    }
    return map;
  }

  private async fetchSeries(
    code: string,
    indicatorId: string,
    dateRange: string,
  ): Promise<YearValue[]> {
    const url =
      `${this.baseUrl.replace(/\/$/, '')}/country/${code}/indicator/${indicatorId}` +
      `?format=json&per_page=200&date=${dateRange}`;
    const payload = await this.http.getJson<WorldBankResponse>(url, { provider: 'world-bank' });
    const rows = this.rows(payload, `${indicatorId} for ${code}`);

    const byYear = new Map<number, number>();
    for (const row of rows) {
      if (typeof row.value !== 'number' || !row.date) continue;
      byYear.set(Number.parseInt(row.date, 10), row.value);
    }

    // Newest first. Missing years are absent: the client plots the available
    // points instead of inventing zeroes.
    return [...byYear.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, value]) => ({ year, value }));
  }

  private rows(payload: WorldBankResponse, context: string): WorldBankEnvelopeRow[] {
    if (!Array.isArray(payload) || !Array.isArray(payload[1])) {
      throw new ProviderError(`world-bank returned no data for ${context}`, {
        provider: 'world-bank',
      });
    }
    return payload[1];
  }
}
