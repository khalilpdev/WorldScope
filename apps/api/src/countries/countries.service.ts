import { Injectable, NotFoundException } from '@nestjs/common';
import {
  INDICATORS,
  type CountryDetailResponse,
  type CountryIndicatorsResponse,
  type CountrySummary,
  type PaginatedCountries,
  type SortOrder,
  type WeatherResponse,
} from '@worldscope/shared';
import { CountryCatalogProvider, type CatalogCountry } from '../providers/country-catalog.provider';
import { OpenMeteoProvider } from '../providers/open-meteo.provider';
import { WorldBankProvider, type PopulationValue } from '../providers/world-bank.provider';
import { toCountryDetail, toCountrySummary } from './country.mapper';
import type { IndicatorsQueryDto } from './dto/indicators-query.dto';
import type { QueryCountriesDto } from './dto/query-countries.dto';

/** Diacritic-insensitive lower-case form used for search matching. */
function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function compareNullable(
  a: number | null,
  b: number | null,
  order: SortOrder,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1; // missing values always last
  if (b === null) return -1;
  return order === 'asc' ? a - b : b - a;
}

@Injectable()
export class CountriesService {
  constructor(
    private readonly catalog: CountryCatalogProvider,
    private readonly worldBank: WorldBankProvider,
    private readonly openMeteo: OpenMeteoProvider,
  ) {}

  async list(query: QueryCountriesDto): Promise<PaginatedCountries> {
    const [snapshot, populationResult] = await Promise.all([
      this.catalog.getSnapshot(),
      this.worldBank.getLatestPopulation(),
    ]);
    const population = new Map<string, PopulationValue>(populationResult.data);

    const facets = {
      regions: [...new Set(snapshot.countries.map((country) => country.region))].sort((a, b) =>
        a.localeCompare(b, 'en'),
      ),
      subregions: [
        ...new Set(
          snapshot.countries
            .map((country) => country.subregion)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort((a, b) => a.localeCompare(b, 'en')),
    };

    let summaries = snapshot.countries.map((country) =>
      toCountrySummary(
        country,
        population.get(country.code),
        this.catalog.flagUrls(country.alpha2),
      ),
    );

    if (query.search) {
      const needle = normalizeText(query.search);
      summaries = summaries.filter(
        (country) =>
          normalizeText(country.name).includes(needle) ||
          normalizeText(country.officialName).includes(needle) ||
          normalizeText(country.code).includes(needle) ||
          normalizeText(country.alpha2).includes(needle),
      );
    }
    if (query.region) {
      const region = query.region.toLowerCase();
      summaries = summaries.filter((country) => country.region.toLowerCase() === region);
    }
    if (query.subregion) {
      const subregion = query.subregion.toLowerCase();
      summaries = summaries.filter(
        (country) => country.subregion?.toLowerCase() === subregion,
      );
    }

    summaries = this.sortSummaries(summaries, query.sortBy, query.order);

    const total = summaries.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);
    const start = (query.page - 1) * query.limit;
    const data = summaries.slice(start, start + query.limit);

    return {
      data,
      meta: { page: query.page, limit: query.limit, total, totalPages },
      facets,
      sources: [snapshot.source, this.worldBank.sourceInfo(populationResult.retrievedAt)],
      cached: snapshot.cached && populationResult.cached,
    };
  }

  async getDetail(code: string): Promise<CountryDetailResponse> {
    const [snapshot, populationResult, metadata] = await Promise.all([
      this.catalog.getSnapshot(),
      this.worldBank.getLatestPopulation(),
      this.worldBank.getCountryMetadata(),
    ]);

    const country = this.requireCountry(snapshot.countries, code);
    const population = new Map<string, PopulationValue>(populationResult.data);
    const meta = new Map(metadata.data).get(country.code);

    return {
      data: toCountryDetail(
        country,
        population.get(country.code),
        meta,
        this.catalog.flagUrls(country.alpha2),
        [snapshot.source, this.worldBank.sourceInfo(metadata.retrievedAt)],
      ),
      cached: snapshot.cached && populationResult.cached && metadata.cached,
    };
  }

  async getIndicators(
    code: string,
    query: IndicatorsQueryDto,
  ): Promise<CountryIndicatorsResponse> {
    const country = await this.findCountry(code);
    const fromYear = new Date().getFullYear() - query.years + 1;
    const indicatorIds = INDICATORS.map((indicator) => indicator.id);

    const result = await this.worldBank.getSeries(country.code, indicatorIds, fromYear);

    const series = INDICATORS.map((definition) => ({
      id: definition.id,
      label: definition.label,
      unit: definition.unit,
      description: definition.description,
      points: (result.data[definition.id] ?? []).map((point) => ({
        year: point.year,
        value: point.value,
      })),
    })).filter((entry) => entry.points.length > 0);

    return {
      data: {
        code: country.code,
        countryName: country.name,
        series,
        sources: [this.worldBank.sourceInfo(result.retrievedAt)],
      },
      cached: result.cached,
    };
  }

  async getWeather(code: string): Promise<WeatherResponse> {
    const [snapshot, metadata] = await Promise.all([
      this.catalog.getSnapshot(),
      this.worldBank.getCountryMetadata(),
    ]);
    const country = this.requireCountry(snapshot.countries, code);
    const meta = new Map(metadata.data).get(country.code);
    const capital = meta?.capitalCity ?? country.capital;
    const coordinates = meta?.coordinates ?? null;

    const base = {
      code: country.code,
      countryName: country.name,
      capital,
      sources: [snapshot.source, this.worldBank.sourceInfo(metadata.retrievedAt)],
    };

    if (!coordinates) {
      return {
        data: {
          ...base,
          coordinates: null,
          timezone: null,
          current: null,
          daily: [],
          unavailableReason:
            'Weather needs capital-city coordinates and none were returned for this country.',
        },
        cached: snapshot.cached && metadata.cached,
      };
    }

    const forecast = await this.openMeteo.getForecast(coordinates);

    return {
      data: {
        ...base,
        coordinates,
        timezone: forecast.data.timezone,
        current: forecast.data.current,
        daily: forecast.data.daily,
        sources: [...base.sources, this.openMeteo.sourceInfo(forecast.data.retrievedAt)],
        unavailableReason: null,
      },
      cached: snapshot.cached && metadata.cached && forecast.cached,
    };
  }

  private sortSummaries(
    summaries: CountrySummary[],
    sortBy: QueryCountriesDto['sortBy'],
    order: SortOrder,
  ): CountrySummary[] {
    const sorted = [...summaries];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'population':
          return compareNullable(a.population, b.population, order) || a.name.localeCompare(b.name, 'en');
        case 'area':
          return compareNullable(a.areaKm2, b.areaKm2, order) || a.name.localeCompare(b.name, 'en');
        case 'density':
          return (
            compareNullable(a.densityPerKm2, b.densityPerKm2, order) ||
            a.name.localeCompare(b.name, 'en')
          );
        case 'name':
        default: {
          const comparison = a.name.localeCompare(b.name, 'en');
          return order === 'asc' ? comparison : -comparison;
        }
      }
    });
    return sorted;
  }

  private requireCountry(countries: CatalogCountry[], code: string): CatalogCountry {
    const normalized = code.toUpperCase();
    const country = countries.find((entry) => entry.code === normalized);
    if (!country) {
      throw new NotFoundException(`Country "${normalized}" was not found`);
    }
    return country;
  }

  private async findCountry(code: string): Promise<CatalogCountry> {
    const country = await this.catalog.getByCode(code);
    if (!country) {
      throw new NotFoundException(`Country "${code.toUpperCase()}" was not found`);
    }
    return country;
  }
}
