import { Injectable } from '@nestjs/common';
import type { OverviewResponse, RegionAggregate } from '@worldscope/shared';
import { toCountrySummary } from '../countries/country.mapper';
import { CountryCatalogProvider } from '../providers/country-catalog.provider';
import { WorldBankProvider, type PopulationValue } from '../providers/world-bank.provider';

const HIGHLIGHT_COUNT = 6;

@Injectable()
export class OverviewService {
  constructor(
    private readonly catalog: CountryCatalogProvider,
    private readonly worldBank: WorldBankProvider,
  ) {}

  async getOverview(): Promise<OverviewResponse> {
    const [snapshot, populationResult] = await Promise.all([
      this.catalog.getSnapshot(),
      this.worldBank.getLatestPopulation(),
    ]);
    const population = new Map<string, PopulationValue>(populationResult.data);

    const summaries = snapshot.countries.map((country) =>
      toCountrySummary(
        country,
        population.get(country.code),
        this.catalog.flagUrls(country.alpha2),
      ),
    );

    const byRegion = new Map<string, { countryCount: number; population: number }>();
    let totalPopulation = 0;
    let populationYear: string | null = null;

    for (const country of summaries) {
      if (country.population !== null) {
        totalPopulation += country.population;
        if (country.populationYear && Number(country.populationYear) > Number(populationYear ?? 0)) {
          populationYear = country.populationYear;
        }
      }
      const bucket = byRegion.get(country.region) ?? { countryCount: 0, population: 0 };
      bucket.countryCount += 1;
      bucket.population += country.population ?? 0;
      byRegion.set(country.region, bucket);
    }

    const regions: RegionAggregate[] = [...byRegion.entries()]
      .map(([region, bucket]) => ({
        region,
        countryCount: bucket.countryCount,
        population: bucket.population > 0 ? bucket.population : null,
      }))
      .sort((a, b) => b.countryCount - a.countryCount);

    const highlights = [...summaries]
      .filter((country) => country.population !== null)
      .sort((a, b) => (b.population ?? 0) - (a.population ?? 0))
      .slice(0, HIGHLIGHT_COUNT);

    const subregions = new Set(
      snapshot.countries
        .map((country) => country.subregion)
        .filter((value): value is string => Boolean(value)),
    );

    return {
      data: {
        totals: {
          countries: summaries.length,
          regions: regions.length,
          subregions: subregions.size,
          population: totalPopulation > 0 ? totalPopulation : null,
          populationYear,
        },
        regions,
        highlights,
      },
      sources: [snapshot.source, this.worldBank.sourceInfo(populationResult.retrievedAt)],
      cached: snapshot.cached && populationResult.cached,
    };
  }
}
