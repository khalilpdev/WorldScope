import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  COMPARISON_INDICATOR_IDS,
  INDICATORS,
  MAX_COMPARE_COUNTRIES,
  type CompareResponse,
  type ComparisonCountry,
  type ComparisonMetric,
} from '@worldscope/shared';
import { CountryCatalogProvider } from '../providers/country-catalog.provider';
import { WorldBankProvider } from '../providers/world-bank.provider';
import { computeDensity } from '../countries/country.mapper';

const INDICATOR_LABELS = new Map(INDICATORS.map((indicator) => [indicator.id, indicator]));

@Injectable()
export class CompareService {
  constructor(
    private readonly catalog: CountryCatalogProvider,
    private readonly worldBank: WorldBankProvider,
  ) {}

  async compare(codes: string[]): Promise<CompareResponse> {
    const unique = [...new Set(codes.map((code) => code.toUpperCase()))];
    if (unique.length < 2) {
      throw new BadRequestException('Provide at least two distinct country codes.');
    }
    if (unique.length > MAX_COMPARE_COUNTRIES) {
      throw new BadRequestException(
        `At most ${MAX_COMPARE_COUNTRIES} countries can be compared at once.`,
      );
    }

    const snapshot = await this.catalog.getSnapshot();
    const byCode = new Map(snapshot.countries.map((country) => [country.code, country]));

    const unknown = unique.filter((code) => !byCode.has(code));
    if (unknown.length > 0) {
      throw new NotFoundException(`Unknown country code(s): ${unknown.join(', ')}`);
    }

    const [populationResult, latestResult] = await Promise.all([
      this.worldBank.getLatestPopulation(),
      this.worldBank.getLatestValues(unique, COMPARISON_INDICATOR_IDS),
    ]);
    const population = new Map(populationResult.data);

    const countries: ComparisonCountry[] = unique.map((code) => {
      const country = byCode.get(code);
      if (!country) {
        // Guarded by the unknown-code check above; keeps the types honest.
        throw new NotFoundException(`Unknown country code: ${code}`);
      }
      const pop = population.get(code);
      const metrics: ComparisonMetric[] = COMPARISON_INDICATOR_IDS.map((indicatorId) => {
        const definition = INDICATOR_LABELS.get(indicatorId);
        const entry = latestResult.data[indicatorId]?.find(([iso3]) => iso3 === code)?.[1];
        return {
          indicatorId,
          label: definition?.shortLabel ?? indicatorId,
          unit: definition?.unit ?? '',
          value: entry?.value ?? null,
          year: entry?.year ?? null,
        };
      });

      return {
        code,
        name: country.name,
        flag: {
          emoji: country.flagEmoji,
          ...this.catalog.flagUrls(country.alpha2),
        },
        population: pop?.value ?? null,
        populationYear: pop?.year ?? null,
        areaKm2: country.areaKm2,
        densityPerKm2: computeDensity(pop?.value, country.areaKm2),
        metrics,
      };
    });

    const indicators = COMPARISON_INDICATOR_IDS.filter((indicatorId) =>
      countries.some(
        (country) => country.metrics.find((metric) => metric.indicatorId === indicatorId)?.value != null,
      ),
    ).map((indicatorId) => {
      const definition = INDICATOR_LABELS.get(indicatorId);
      return {
        id: indicatorId,
        label: definition?.label ?? indicatorId,
        unit: definition?.unit ?? '',
      };
    });

    return {
      data: {
        countries,
        indicators,
        sources: [
          snapshot.source,
          this.worldBank.sourceInfo(latestResult.retrievedAt),
          this.worldBank.sourceInfo(populationResult.retrievedAt),
        ],
      },
      cached:
        snapshot.cached && latestResult.cached && populationResult.cached,
    };
  }
}
