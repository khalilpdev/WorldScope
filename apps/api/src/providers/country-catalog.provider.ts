import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Coordinates, CurrencyInfo, DataSourceInfo, LanguageInfo } from '@worldscope/shared';
import { CacheService } from '../cache/cache.service';
import { HttpClientService } from '../common/http/http-client.service';
import { ProviderError } from '../common/errors/provider.error';

/** Raw shape of one record in the mledoze/countries dataset. */
interface RawCountry {
  name?: {
    common?: string;
    official?: string;
    native?: Record<string, { official?: string; common?: string }>;
  };
  cca2?: string;
  cca3?: string;
  capital?: string[];
  region?: string;
  subregion?: string;
  area?: number;
  latlng?: number[];
  languages?: Record<string, string>;
  currencies?: Record<string, { name?: string; symbol?: string }>;
  borders?: string[];
  flag?: string;
  independent?: boolean;
  status?: string;
}

export interface CatalogCountry {
  code: string;
  alpha2: string;
  name: string;
  officialName: string;
  nativeName: string | null;
  capital: string | null;
  region: string;
  subregion: string | null;
  areaKm2: number | null;
  coordinates: Coordinates | null;
  languages: LanguageInfo[];
  currencies: CurrencyInfo[];
  borders: string[];
  flagEmoji: string | null;
}

export interface CatalogSnapshot {
  countries: CatalogCountry[];
  source: DataSourceInfo;
  cached: boolean;
}

const CATALOG_CACHE_KEY = 'worldscope:catalog:v1';

@Injectable()
export class CountryCatalogProvider {
  private readonly logger = new Logger(CountryCatalogProvider.name);
  private readonly baseUrl: string;
  private readonly flagCdnBaseUrl: string;
  private readonly ttlSeconds: number;

  constructor(
    private readonly http: HttpClientService,
    private readonly cache: CacheService,
    config: ConfigService,
  ) {
    this.baseUrl = config.getOrThrow<string>('providers.catalogBaseUrl');
    this.flagCdnBaseUrl = config.getOrThrow<string>('providers.flagCdnBaseUrl');
    this.ttlSeconds = config.getOrThrow<number>('cache.catalogTtlSeconds');
  }

  flagUrls(alpha2: string): { png: string; svg: string } {
    const code = alpha2.toLowerCase();
    return {
      png: `${this.flagCdnBaseUrl}/w320/${code}.png`,
      svg: `${this.flagCdnBaseUrl}/${code}.svg`,
    };
  }

  async getSnapshot(): Promise<CatalogSnapshot> {
    const { value, cached } = await this.cache.wrap<Omit<CatalogSnapshot, 'cached'>>(
      CATALOG_CACHE_KEY,
      this.ttlSeconds,
      async () => this.fetchSnapshot(),
    );
    return { ...value, cached };
  }

  async getAll(): Promise<CatalogCountry[]> {
    return (await this.getSnapshot()).countries;
  }

  async getByCode(code: string): Promise<CatalogCountry | null> {
    const countries = await this.getAll();
    const normalized = code.toUpperCase();
    return countries.find((country) => country.code === normalized) ?? null;
  }

  private async fetchSnapshot(): Promise<Omit<CatalogSnapshot, 'cached'>> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/countries.json`;
    const raw = await this.http.getJson<RawCountry[]>(url, {
      provider: 'country-catalog',
      timeoutMs: 15_000,
      retries: 1,
    });

    if (!Array.isArray(raw)) {
      throw new ProviderError('country-catalog returned an unexpected payload', {
        provider: 'country-catalog',
      });
    }

    const countries = raw
      .map((entry) => this.normalize(entry))
      .filter((country): country is CatalogCountry => country !== null)
      .sort((a, b) => a.name.localeCompare(b.name, 'en'));

    this.logger.log(`Country catalogue loaded: ${countries.length} countries`);

    return {
      countries,
      source: {
        id: 'country-catalog',
        name: 'mledoze/countries (pinned dataset)',
        url: this.baseUrl,
        retrievedAt: new Date().toISOString(),
        license: 'ODbL 1.0',
        note: 'Static JSON dataset of ISO 3166 countries; no request-time API.',
      },
    };
  }

  private normalize(entry: RawCountry): CatalogCountry | null {
    if (!entry.cca3 || !entry.cca2 || !entry.name?.common) return null;

    const nativeEntries = Object.entries(entry.name.native ?? {});
    const nativeName =
      nativeEntries.length > 0 ? (nativeEntries[0]?.[1]?.common ?? null) : null;

    const languages = Object.entries(entry.languages ?? {}).map(([code, name]) => ({
      code,
      name,
    }));

    const currencies = Object.entries(entry.currencies ?? {}).map(([code, details]) => ({
      code,
      name: details.name ?? code,
      symbol: details.symbol ?? null,
    }));

    const coordinates =
      Array.isArray(entry.latlng) &&
      entry.latlng.length === 2 &&
      typeof entry.latlng[0] === 'number' &&
      typeof entry.latlng[1] === 'number'
        ? { lat: entry.latlng[0], lng: entry.latlng[1] }
        : null;

    return {
      code: entry.cca3.toUpperCase(),
      alpha2: entry.cca2.toUpperCase(),
      name: entry.name.common,
      officialName: entry.name.official ?? entry.name.common,
      nativeName,
      capital: entry.capital?.[0] ?? null,
      region: entry.region ?? 'Unspecified',
      subregion: entry.subregion ?? null,
      areaKm2: typeof entry.area === 'number' && entry.area > 0 ? entry.area : null,
      coordinates,
      languages,
      currencies,
      borders: entry.borders ?? [],
      flagEmoji: entry.flag ?? null,
    };
  }
}
